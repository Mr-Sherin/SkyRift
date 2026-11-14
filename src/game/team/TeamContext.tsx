'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  TeamRole,
  TeamRoomState,
  ChatMessage,
  ActionVote,
  DesignReviewStatus,
  INITIAL_DESIGN_REVIEWS,
  TEAM_ROLES,
  RoleInfo,
} from './teamTypes';
import { SubsystemType, SpacecraftComponent, LaunchVehicle, MissionScenario } from '@/game/types';
import { FlightAction } from '@/lib/simulation';
import { useGameStore } from '@/game/engine/gameStore';
import { sfx } from '@/lib/audio';

export type GameMode = 'solo' | 'team';

interface TeamContextType {
  gameMode: GameMode;
  roomCode: string | null;
  myPlayerId: string;
  myRole: TeamRole | null;
  myName: string;
  roomState: TeamRoomState | null;
  isConnected: boolean;
  activeDesignReviews: Record<TeamRole, DesignReviewStatus>;
  turnVotes: Record<string, ActionVote>;
  chatMessages: ChatMessage[];
  unreadChatCount: number;
  myRoleInfo: RoleInfo | null;
  isHost: boolean;
  fillEmptyRoles: boolean;

  // Role permissions
  canEditSubsystem: (subsystem: SubsystemType) => boolean;
  canSelectMission: () => boolean;
  canSelectRocket: () => boolean;
  canExecuteFlightTurn: () => boolean;

  // Team actions
  createRoom: (name?: string, role?: TeamRole) => Promise<{ success: boolean; code?: string; error?: string }>;
  joinRoom: (code: string, name?: string, role?: TeamRole) => Promise<{ success: boolean; error?: string }>;
  leaveRoom: () => void;
  selectRole: (role: TeamRole) => void;
  toggleFillEmptyRoles: (enabled: boolean) => void;
  submitDesignReview: (decision: 'approved' | 'rejected', reason?: string) => void;
  voteFlightAction: (action: FlightAction) => void;
  executeFlightTurn: (action: FlightAction, flightState: any) => void;
  sendChatMessage: (text: string, isQuickMsg?: boolean) => void;
  markChatRead: () => void;
}

const TeamContext = createContext<TeamContextType | null>(null);

const STORAGE_KEY_ROOM = 'skyrift_team_room_code';
const STORAGE_KEY_ROLE = 'skyrift_team_my_role';
const STORAGE_KEY_NAME = 'skyrift_team_my_name';

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [gameMode, setGameMode] = useState<GameMode>('solo');
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [myRole, setMyRole] = useState<TeamRole | null>(null);
  const [myName, setMyName] = useState<string>('Commander Alex');
  const [roomState, setRoomState] = useState<TeamRoomState | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);

  const socketRef = useRef<Socket | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);
  const isInternalSyncRef = useRef<boolean>(false);

  // Initialize stored player name & role
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem(STORAGE_KEY_NAME);
      if (storedName) setMyName(storedName);

      const storedCode = sessionStorage.getItem(STORAGE_KEY_ROOM);
      const storedRole = sessionStorage.getItem(STORAGE_KEY_ROLE) as TeamRole | null;
      if (storedCode) {
        setRoomCode(storedCode);
        setGameMode('team');
      }
      if (storedRole) {
        setMyRole(storedRole);
      }
    }
  }, []);

  // BroadcastChannel for instant zero-latency multi-tab sync
  useEffect(() => {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return;

    const bc = new BroadcastChannel('skyrift_multiplayer_sync_channel');
    bcRef.current = bc;

    bc.onmessage = (event) => {
      const { type, payload } = event.data || {};
      if (!payload || (roomCode && payload.roomCode && payload.roomCode !== roomCode)) return;

      switch (type) {
        case 'ROOM_UPDATED':
          setRoomState(payload.room);
          break;
        case 'CHAT_RECEIVED':
          setRoomState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              chatMessages: [...prev.chatMessages, payload.message],
            };
          });
          setUnreadChatCount((c) => c + 1);
          break;
        case 'DESIGN_REVIEW_UPDATED':
          setRoomState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              designReviews: payload.designReviews,
            };
          });
          break;
        case 'VOTES_UPDATED':
          setRoomState((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              turnVotes: payload.turnVotes,
            };
          });
          break;
        case 'STATE_SYNC':
          handleIncomingStateSync(payload.stateDiff);
          break;
      }
    };

    return () => {
      bc.close();
    };
  }, [roomCode]);

  // Connect Socket.io client
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Connect to port 3001
    const socketHost = window.location.hostname || 'localhost';
    const socketUrl = `http://${socketHost}:3001`;

    const socket = io(socketUrl, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 3000,
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setMyPlayerId(socket.id || `tab_${Math.random().toString(36).substring(2, 7)}`);

      // Auto-rejoin if active session exists
      const savedCode = sessionStorage.getItem(STORAGE_KEY_ROOM);
      const savedRole = sessionStorage.getItem(STORAGE_KEY_ROLE) as TeamRole | null;
      if (savedCode) {
        socket.emit(
          'room:join',
          { roomCode: savedCode, playerName: myName, role: savedRole },
          (res: any) => {
            if (res?.success && res.room) {
              setRoomState(res.room);
              setGameMode('team');
            }
          }
        );
      }
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', () => {
      // Offline/fallback to BroadcastChannel
      setIsConnected(false);
    });

    socket.on('room:updated', (updatedRoom: TeamRoomState) => {
      setRoomState(updatedRoom);
      if (bcRef.current) {
        bcRef.current.postMessage({ type: 'ROOM_UPDATED', payload: { room: updatedRoom } });
      }
    });

    socket.on('chat:received', (message: ChatMessage) => {
      setRoomState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          chatMessages: [...prev.chatMessages, message],
        };
      });
      setUnreadChatCount((c) => c + 1);
      sfx.playComponentAttach();
    });

    socket.on('design_review:updated', (reviews: Record<TeamRole, DesignReviewStatus>) => {
      setRoomState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          designReviews: reviews,
        };
      });
      sfx.playAlert();
    });

    socket.on('flight:votes_updated', (votes: Record<string, ActionVote>) => {
      setRoomState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          turnVotes: votes,
        };
      });
    });

    socket.on('state:received', ({ stateDiff }: { senderRole: TeamRole; stateDiff: any }) => {
      handleIncomingStateSync(stateDiff);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Handle incoming spacecraft changes from teammates
  const handleIncomingStateSync = (stateDiff: any) => {
    isInternalSyncRef.current = true;
    const store = useGameStore.getState();

    if (stateDiff.selectedMission) {
      store.selectMission(stateDiff.selectedMission);
    }
    if (stateDiff.selectedRocket !== undefined) {
      store.selectRocket(stateDiff.selectedRocket);
    }
    if (stateDiff.installedParts) {
      useGameStore.setState({ installedParts: stateDiff.installedParts });
    }
    setTimeout(() => {
      isInternalSyncRef.current = false;
    }, 50);
  };

  // Sync local changes to team when in team mode
  useEffect(() => {
    if (gameMode !== 'team' || !roomCode) return;

    const unsub = useGameStore.subscribe((state, prevState) => {
      if (isInternalSyncRef.current) return;

      const hasPartsChanged = state.installedParts !== prevState.installedParts;
      const hasMissionChanged = state.selectedMission.id !== prevState.selectedMission.id;
      const hasRocketChanged = state.selectedRocket?.id !== prevState.selectedRocket?.id;

      if (hasPartsChanged || hasMissionChanged || hasRocketChanged) {
        const diff: any = {};
        if (hasPartsChanged) diff.installedParts = state.installedParts;
        if (hasMissionChanged) diff.selectedMission = state.selectedMission;
        if (hasRocketChanged) diff.selectedRocket = state.selectedRocket;

        // Send via Socket.io
        if (socketRef.current?.connected) {
          socketRef.current.emit('state:sync', {
            roomCode,
            senderRole: myRole,
            stateDiff: diff,
          });
        }

        // Send via BroadcastChannel
        if (bcRef.current) {
          bcRef.current.postMessage({
            type: 'STATE_SYNC',
            payload: { roomCode, stateDiff: diff },
          });
        }
      }
    });

    return () => unsub();
  }, [gameMode, roomCode, myRole]);

  // 1. Create Team Room
  const createRoom = useCallback(
    async (name?: string, role: TeamRole = 'director'): Promise<{ success: boolean; code?: string; error?: string }> => {
      const playerName = name || myName;
      setMyName(playerName);
      setMyRole(role);
      localStorage.setItem(STORAGE_KEY_NAME, playerName);
      sessionStorage.setItem(STORAGE_KEY_ROLE, role);

      if (socketRef.current?.connected) {
        return new Promise((resolve) => {
          socketRef.current?.emit(
            'room:create',
            { hostName: playerName, role },
            (res: any) => {
              if (res?.success && res.room) {
                setRoomCode(res.room.code);
                setRoomState(res.room);
                setGameMode('team');
                sessionStorage.setItem(STORAGE_KEY_ROOM, res.room.code);
                sfx.playClick();
                resolve({ success: true, code: res.room.code });
              } else {
                resolve({ success: false, error: res?.error || 'Could not create room' });
              }
            }
          );
        });
      }

      // Offline / Tab-only fallback
      const fallbackCode = `SKY-${Math.floor(10 + Math.random() * 90)}`;
      const fallbackRoom: TeamRoomState = {
        code: fallbackCode,
        hostPlayerId: 'local_host',
        status: 'lobby',
        players: {
          local_host: {
            id: 'local_host',
            name: playerName,
            role,
            isReady: true,
            joinedAt: Date.now(),
          },
        },
        designReviews: INITIAL_DESIGN_REVIEWS,
        turnVotes: {},
        chatMessages: [
          {
            id: `msg-${Date.now()}`,
            senderName: 'SkyRift Uplink',
            role: null,
            text: `Mission Control room ${fallbackCode} initialized.`,
            timestamp: Date.now(),
            isQuickMsg: true,
          },
        ],
        lastSyncedTimestamp: Date.now(),
      };

      setRoomCode(fallbackCode);
      setRoomState(fallbackRoom);
      setGameMode('team');
      sessionStorage.setItem(STORAGE_KEY_ROOM, fallbackCode);

      if (bcRef.current) {
        bcRef.current.postMessage({ type: 'ROOM_UPDATED', payload: { room: fallbackRoom } });
      }
      return { success: true, code: fallbackCode };
    },
    [myName]
  );

  // 2. Join Team Room
  const joinRoom = useCallback(
    async (code: string, name?: string, role?: TeamRole): Promise<{ success: boolean; error?: string }> => {
      const cleanCode = (code || '').trim().toUpperCase();
      if (!cleanCode) return { success: false, error: 'Please enter a valid room code.' };

      const playerName = name || myName;
      setMyName(playerName);
      localStorage.setItem(STORAGE_KEY_NAME, playerName);

      if (socketRef.current?.connected) {
        return new Promise((resolve) => {
          socketRef.current?.emit(
            'room:join',
            { roomCode: cleanCode, playerName, role },
            (res: any) => {
              if (res?.success && res.room) {
                setRoomCode(cleanCode);
                setRoomState(res.room);
                setGameMode('team');

                const myPlayer = res.room.players[res.playerId];
                if (myPlayer?.role) {
                  setMyRole(myPlayer.role);
                  sessionStorage.setItem(STORAGE_KEY_ROLE, myPlayer.role);
                }
                sessionStorage.setItem(STORAGE_KEY_ROOM, cleanCode);
                sfx.playClick();
                resolve({ success: true });
              } else {
                resolve({ success: false, error: res?.error || 'Room not found or full.' });
              }
            }
          );
        });
      }

      // Offline / Local cross-tab join
      const joinRole = role || 'engineer';
      const myId = `tab_${Math.random().toString(36).substring(2, 6)}`;
      setMyPlayerId(myId);
      setMyRole(joinRole);
      setRoomCode(cleanCode);
      setGameMode('team');
      sessionStorage.setItem(STORAGE_KEY_ROOM, cleanCode);
      sessionStorage.setItem(STORAGE_KEY_ROLE, joinRole);

      return { success: true };
    },
    [myName]
  );

  // 3. Leave Room (Return to Solo Mode)
  const leaveRoom = useCallback(() => {
    sfx.playClick();
    setGameMode('solo');
    setRoomCode(null);
    setMyRole(null);
    setRoomState(null);
    sessionStorage.removeItem(STORAGE_KEY_ROOM);
    sessionStorage.removeItem(STORAGE_KEY_ROLE);
  }, []);

  // 4. Select / Switch Role
  const selectRole = useCallback(
    (role: TeamRole) => {
      sfx.playClick();
      setMyRole(role);
      sessionStorage.setItem(STORAGE_KEY_ROLE, role);

      if (roomCode && socketRef.current?.connected) {
        socketRef.current.emit('role:select', {
          roomCode,
          playerId: myPlayerId,
          role,
        });
      }
    },
    [roomCode, myPlayerId]
  );

  // 4b. Toggle Fill Empty Roles (Host Only)
  const toggleFillEmptyRoles = useCallback(
    (enabled: boolean) => {
      sfx.playClick();
      setRoomState((prev) => {
        if (!prev) return prev;
        const updatedReviews = { ...prev.designReviews };
        if (enabled) {
          const hostPlayer = prev.players[prev.hostPlayerId];
          const hostRole = hostPlayer?.role;
          if (hostRole && updatedReviews[hostRole]?.approved) {
            const assigned = Object.values(prev.players).map((p) => p.role).filter(Boolean);
            (['director', 'engineer', 'science', 'comms'] as TeamRole[]).forEach((r) => {
              if (!assigned.includes(r)) {
                updatedReviews[r] = {
                  approved: true,
                  rejected: false,
                  autoApproved: true,
                  timestamp: Date.now(),
                };
              }
            });
          }
        }
        return {
          ...prev,
          fillEmptyRoles: enabled,
          designReviews: updatedReviews,
        };
      });

      if (roomCode && socketRef.current?.connected) {
        socketRef.current.emit('room:toggle_fill_empty_roles', {
          roomCode,
          fillEmptyRoles: enabled,
        });
      }
    },
    [roomCode]
  );

  // 5. Submit Design Review (Approve / Reject)
  const submitDesignReview = useCallback(
    (decision: 'approved' | 'rejected', reason?: string) => {
      if (!myRole || !roomCode) return;
      sfx.playClick();

      const hostId = roomState?.hostPlayerId || myPlayerId;
      const isCurrentHost = !myPlayerId || roomState?.hostPlayerId === myPlayerId;
      const fillEmpty = roomState?.fillEmptyRoles ?? (roomState ? Object.keys(roomState.players).length <= 1 : true);
      const claimedRoles = roomState ? Object.values(roomState.players).map((p) => p.role).filter(Boolean) : [myRole];

      const updated = {
        ...(roomState?.designReviews || INITIAL_DESIGN_REVIEWS),
        [myRole]: {
          approved: decision === 'approved',
          rejected: decision === 'rejected',
          reason: reason || undefined,
          timestamp: Date.now(),
        },
      };

      // If host approves and fillEmptyRoles is active, automatically approve empty roles!
      if (isCurrentHost && fillEmpty && decision === 'approved') {
        (['director', 'engineer', 'science', 'comms'] as TeamRole[]).forEach((r) => {
          if (!claimedRoles.includes(r)) {
            updated[r] = {
              approved: true,
              rejected: false,
              autoApproved: true,
              timestamp: Date.now(),
            };
          }
        });
      }

      setRoomState((prev) => (prev ? { ...prev, designReviews: updated } : prev));

      if (socketRef.current?.connected) {
        socketRef.current.emit('design_review:update', {
          roomCode,
          role: myRole,
          decision,
          reason,
        });
      }

      if (bcRef.current) {
        bcRef.current.postMessage({
          type: 'DESIGN_REVIEW_UPDATED',
          payload: { roomCode, designReviews: updated },
        });
      }
    },
    [myRole, roomCode, roomState, myPlayerId]
  );

  // 6. In-Flight Action Vote (Suggestions by other crew members)
  const voteFlightAction = useCallback(
    (action: FlightAction) => {
      if (!myRole || !roomCode) return;
      sfx.playClick();

      const vote: ActionVote = {
        role: myRole,
        senderName: myName,
        action,
        timestamp: Date.now(),
      };

      setRoomState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          turnVotes: {
            ...prev.turnVotes,
            [myRole]: vote,
          },
        };
      });

      if (socketRef.current?.connected) {
        socketRef.current.emit('flight:vote', {
          roomCode,
          role: myRole,
          senderName: myName,
          action,
        });
      }

      if (bcRef.current) {
        bcRef.current.postMessage({
          type: 'VOTES_UPDATED',
          payload: {
            roomCode,
            turnVotes: { ...(roomState?.turnVotes || {}), [myRole]: vote },
          },
        });
      }
    },
    [myRole, roomCode, myName, roomState]
  );

  // 7. In-Flight Turn Executed (by Comms & Ops)
  const executeFlightTurn = useCallback(
    (action: FlightAction, flightState: any) => {
      if (!roomCode) return;

      if (socketRef.current?.connected) {
        socketRef.current.emit('flight:execute', {
          roomCode,
          action,
          flightState,
        });
      }
    },
    [roomCode]
  );

  // 8. Send Chat Message
  const sendChatMessage = useCallback(
    (text: string, isQuickMsg?: boolean) => {
      const cleanText = text.trim();
      if (!cleanText || !roomCode) return;

      const newMsg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        senderName: myName,
        role: myRole,
        text: cleanText,
        timestamp: Date.now(),
        isQuickMsg: !!isQuickMsg,
      };

      setRoomState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          chatMessages: [...prev.chatMessages, newMsg],
        };
      });

      if (socketRef.current?.connected) {
        socketRef.current.emit('chat:send', {
          roomCode,
          message: newMsg,
        });
      }

      if (bcRef.current) {
        bcRef.current.postMessage({
          type: 'CHAT_RECEIVED',
          payload: { roomCode, message: newMsg },
        });
      }

      sfx.playComponentAttach();
    },
    [myName, myRole, roomCode]
  );

  const markChatRead = useCallback(() => {
    setUnreadChatCount(0);
  }, []);

  // Host status & fillEmptyRoles toggle state
  const isHost = !myPlayerId || !roomState ? true : roomState.hostPlayerId === myPlayerId;
  const fillEmptyRoles = roomState?.fillEmptyRoles ?? (roomState ? Object.keys(roomState.players).length <= 1 : true);

  // Category & Action permissions
  const canEditSubsystem = useCallback(
    (subsystem: SubsystemType): boolean => {
      if (gameMode === 'solo') return true;
      if (!myRole) return false;
      if (TEAM_ROLES[myRole]?.managedSubsystems.includes(subsystem)) return true;

      // When fillEmptyRoles is true and current player is host, host controls empty roles
      const isCurrentHost = !myPlayerId || !roomState ? true : roomState.hostPlayerId === myPlayerId;
      const fillEmpty = roomState?.fillEmptyRoles ?? (roomState ? Object.keys(roomState.players).length <= 1 : true);
      if (isCurrentHost && fillEmpty) {
        const managingRole: TeamRole = ['structure', 'power', 'thermal', 'cdh'].includes(subsystem)
          ? 'engineer'
          : subsystem === 'payload'
          ? 'science'
          : 'comms';
        const claimedRoles = roomState ? Object.values(roomState.players).map((p) => p.role).filter(Boolean) : [];
        if (!claimedRoles.includes(managingRole)) {
          return true;
        }
      }

      return false;
    },
    [gameMode, myRole, roomState, myPlayerId]
  );

  const canSelectMission = useCallback((): boolean => {
    if (gameMode === 'solo') return true;
    if (myRole === 'director') return true;
    const isCurrentHost = !myPlayerId || !roomState ? true : roomState.hostPlayerId === myPlayerId;
    const fillEmpty = roomState?.fillEmptyRoles ?? (roomState ? Object.keys(roomState.players).length <= 1 : true);
    if (isCurrentHost && fillEmpty) {
      const claimedRoles = roomState ? Object.values(roomState.players).map((p) => p.role).filter(Boolean) : [];
      if (!claimedRoles.includes('director')) return true;
    }
    return false;
  }, [gameMode, myRole, roomState, myPlayerId]);

  const canSelectRocket = useCallback((): boolean => {
    if (gameMode === 'solo') return true;
    if (myRole === 'director') return true;
    const isCurrentHost = !myPlayerId || !roomState ? true : roomState.hostPlayerId === myPlayerId;
    const fillEmpty = roomState?.fillEmptyRoles ?? (roomState ? Object.keys(roomState.players).length <= 1 : true);
    if (isCurrentHost && fillEmpty) {
      const claimedRoles = roomState ? Object.values(roomState.players).map((p) => p.role).filter(Boolean) : [];
      if (!claimedRoles.includes('director')) return true;
    }
    return false;
  }, [gameMode, myRole, roomState, myPlayerId]);

  const canExecuteFlightTurn = useCallback((): boolean => {
    if (gameMode === 'solo') return true;
    if (myRole === 'comms') return true;
    const isCurrentHost = !myPlayerId || !roomState ? true : roomState.hostPlayerId === myPlayerId;
    const fillEmpty = roomState?.fillEmptyRoles ?? (roomState ? Object.keys(roomState.players).length <= 1 : true);
    if (isCurrentHost && fillEmpty) {
      const claimedRoles = roomState ? Object.values(roomState.players).map((p) => p.role).filter(Boolean) : [];
      if (!claimedRoles.includes('comms')) return true;
    }
    return false;
  }, [gameMode, myRole, roomState, myPlayerId]);

  const activeDesignReviews = roomState?.designReviews || INITIAL_DESIGN_REVIEWS;
  const turnVotes = roomState?.turnVotes || {};
  const chatMessages = roomState?.chatMessages || [];
  const myRoleInfo = myRole ? TEAM_ROLES[myRole] : null;

  return (
    <TeamContext.Provider
      value={{
        gameMode,
        roomCode,
        myPlayerId,
        myRole,
        myName,
        roomState,
        isConnected,
        activeDesignReviews,
        turnVotes,
        chatMessages,
        unreadChatCount,
        myRoleInfo,
        isHost,
        fillEmptyRoles,
        canEditSubsystem,
        canSelectMission,
        canSelectRocket,
        canExecuteFlightTurn,
        createRoom,
        joinRoom,
        leaveRoom,
        selectRole,
        toggleFillEmptyRoles,
        submitDesignReview,
        voteFlightAction,
        executeFlightTurn,
        sendChatMessage,
        markChatRead,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
}

