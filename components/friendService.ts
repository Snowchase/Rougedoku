// friendService.ts
// Handles all friend-related Firebase operations

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  query, 
  where, 
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from './firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  validateUsername,
  validateScore,
  validateDate,
  rateLimiter,
  RATE_LIMITS,
} from '../utils/validation';

export interface UserProfile {
  userId: string;
  username: string;
  friendCode: string;
  avatar?: string; // Emoji avatar
  profileColor?: string; // Hex color for profile
  createdAt: any;
  friends: string[]; // Array of friend userIds
  blockedUsers?: string[]; // Array of blocked userIds
  hasBeenReferred?: boolean; // Whether this user used a referral code
  referralCount?: number; // How many users this user has successfully referred
  referralCoinsEarned?: number; // Lifetime coins earned from referrals (Firestore source of truth for sync)
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  toUsername: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: any;
}

export interface DailyScore {
  userId: string;
  username: string;
  avatar?: string; // User's emoji avatar
  profileColor?: string; // User's profile color
  date: string;
  difficulty: string;
  timeSeconds: number;
  hintsUsed: number;
  completed: boolean;
  completedAt: any;
}

// Available avatar emojis (free - excludes shop items)
export const AVATAR_OPTIONS = [
  '😀', '😎', '🤓', '🥳', '🤩', '🤗', '🙂', '😊',
  '🐶', '🐱', '🐸', '🐙', '🐵', '🐔', '🦆', '🐢',
  '🌟', '🎮', '🎯', '🎨', '🎭', '🎪', '🎬', '🎸',
  '🍪', '🥑', '🍉', '🍓', '🥨', '🧁', '🥤', '🍇',
];

// Available profile colors
export const PROFILE_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Orange
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Deep Orange
];

// Generate a random 6-character friend code
function generateFriendCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Get random avatar
function getRandomAvatar(): string {
  return AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
}

// Get random profile color
function getRandomProfileColor(): string {
  return PROFILE_COLORS[Math.floor(Math.random() * PROFILE_COLORS.length)];
}

// Initialize auth and create/load user profile
export async function initializeUser(username?: string): Promise<UserProfile | null> {
  try {
    // Check if user is already authenticated
    let userId: string;
    if (auth.currentUser) {
      // User already signed in, use existing user
      userId = auth.currentUser.uid;
    } else {
      // Sign in anonymously
      const userCredential = await signInAnonymously(auth);
      userId = userCredential.user.uid;
    }

    // Check if profile already exists
    const userDoc = await getDoc(doc(db, 'users', userId));

    if (userDoc.exists()) {
      // Save to local storage for backup
      await AsyncStorage.setItem('userProfile', JSON.stringify(userDoc.data()));
      // Return existing profile
      return userDoc.data() as UserProfile;
    }

    // Create new profile
    if (!username) {
      username = `Player${Math.floor(Math.random() * 10000)}`;
    }

    const friendCode = generateFriendCode();
    const profile: UserProfile = {
      userId,
      username,
      friendCode,
      avatar: getRandomAvatar(),
      profileColor: getRandomProfileColor(),
      createdAt: serverTimestamp(),
      friends: [],
      blockedUsers: [],
      hasBeenReferred: false,
      referralCount: 0,
      referralCoinsEarned: 0,
    };

    await setDoc(doc(db, 'users', userId), profile);

    // Save to local storage
    await AsyncStorage.setItem('userProfile', JSON.stringify(profile));

    return profile;
  } catch (error) {
    console.error('Error initializing user:', error);

    // Fall back to cached profile from AsyncStorage when Firebase is unreachable
    try {
      const cachedProfileStr = await AsyncStorage.getItem('userProfile');
      if (cachedProfileStr) {
        console.log('Using cached profile from AsyncStorage');
        return JSON.parse(cachedProfileStr) as UserProfile;
      }
    } catch (storageError) {
      console.error('Error loading cached profile:', storageError);
    }

    return null;
  }
}

// Get current user
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

// Listen to auth state changes
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Update username
export async function updateUsername(newUsername: string): Promise<boolean> {
  try {
    const user = auth.currentUser;
    if (!user) return false;

    await updateDoc(doc(db, 'users', user.uid), {
      username: newUsername,
    });

    return true;
  } catch (error) {
    console.error('Error updating username:', error);
    return false;
  }
}

// Update user profile (username, avatar, profileColor)
export async function updateProfile(updates: {
  username?: string;
  avatar?: string;
  profileColor?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) return { success: false, error: 'Not logged in' };

    // Validate username if provided
    if (updates.username) {
      // Check rate limit
      const rateLimitKey = `username_change_${user.uid}`;
      if (!rateLimiter.isAllowed(
        rateLimitKey,
        RATE_LIMITS.USERNAME_CHANGE.maxActions,
        RATE_LIMITS.USERNAME_CHANGE.windowMs
      )) {
        return {
          success: false,
          error: 'You can only change your username 3 times per day',
        };
      }

      const validation = validateUsername(updates.username);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }
    }

    await updateDoc(doc(db, 'users', user.uid), updates);

    // Update AsyncStorage backup with the new profile data
    try {
      const cachedProfileStr = await AsyncStorage.getItem('userProfile');
      if (cachedProfileStr) {
        const cachedProfile = JSON.parse(cachedProfileStr);
        const updatedProfile = { ...cachedProfile, ...updates };
        await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      }
    } catch (storageError) {
      // Non-critical: just log the error, don't fail the update
      console.warn('Failed to update AsyncStorage backup:', storageError);
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error: 'Failed to update profile' };
  }
}

// Get user profile by ID
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

// Find user by friend code
export async function findUserByFriendCode(friendCode: string): Promise<UserProfile | null> {
  try {
    const q = query(collection(db, 'users'), where('friendCode', '==', friendCode.toUpperCase()));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error finding user by friend code:', error);
    return null;
  }
}

// Send friend request
export async function sendFriendRequest(friendCode: string): Promise<{ success: boolean; message: string }> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, message: 'Not logged in' };
    }

    // Check rate limit
    const rateLimitKey = `friend_request_${currentUser.uid}`;
    if (!rateLimiter.isAllowed(
      rateLimitKey,
      RATE_LIMITS.FRIEND_REQUEST.maxActions,
      RATE_LIMITS.FRIEND_REQUEST.windowMs
    )) {
      const retryAfter = rateLimiter.getRetryAfter(
        rateLimitKey,
        RATE_LIMITS.FRIEND_REQUEST.maxActions,
        RATE_LIMITS.FRIEND_REQUEST.windowMs
      );
      const minutesLeft = Math.ceil(retryAfter / 60000);
      return {
        success: false,
        message: `Too many requests. Please wait ${minutesLeft} minutes.`,
      };
    }

    // Get current user profile
    const myProfile = await getUserProfile(currentUser.uid);
    if (!myProfile) {
      return { success: false, message: 'Profile not found' };
    }

    // Find friend by code
    const friendProfile = await findUserByFriendCode(friendCode);
    if (!friendProfile) {
      return { success: false, message: 'Friend code not found' };
    }

    // Can't add yourself
    if (friendProfile.userId === currentUser.uid) {
      return { success: false, message: "Can't add yourself!" };
    }

    // Check if blocked by the other user
    if (friendProfile.blockedUsers?.includes(currentUser.uid)) {
      return { success: false, message: 'Unable to send friend request' };
    }

    // Check if you blocked them
    if (myProfile.blockedUsers?.includes(friendProfile.userId)) {
      return {
        success: false,
        message: 'You have blocked this user. Unblock them first.',
      };
    }

    // Check if already friends
    if (myProfile.friends.includes(friendProfile.userId)) {
      return { success: false, message: 'Already friends!' };
    }

    // Check for existing pending request
    const existingQ = query(
      collection(db, 'friendRequests'),
      where('fromUserId', '==', currentUser.uid),
      where('toUserId', '==', friendProfile.userId),
      where('status', '==', 'pending')
    );
    const existingRequests = await getDocs(existingQ);

    if (!existingRequests.empty) {
      return { success: false, message: 'Request already sent!' };
    }

    // Create friend request
    const requestData: Omit<FriendRequest, 'id'> = {
      fromUserId: currentUser.uid,
      fromUsername: myProfile.username,
      toUserId: friendProfile.userId,
      toUsername: friendProfile.username,
      status: 'pending',
      createdAt: serverTimestamp(),
    };

    const requestRef = doc(collection(db, 'friendRequests'));
    await setDoc(requestRef, requestData);

    return { success: true, message: `Request sent to ${friendProfile.username}!` };
  } catch (error) {
    console.error('Error sending friend request:', error);
    return { success: false, message: 'Error sending request' };
  }
}

// Get pending friend requests (received)
export async function getPendingRequests(): Promise<FriendRequest[]> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return [];

    const q = query(
      collection(db, 'friendRequests'),
      where('toUserId', '==', currentUser.uid),
      where('status', '==', 'pending')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as FriendRequest));
  } catch (error) {
    console.error('Error getting pending requests:', error);
    return [];
  }
}

// Accept friend request
export async function acceptFriendRequest(requestId: string): Promise<boolean> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return false;

    // Get the request
    const requestDoc = await getDoc(doc(db, 'friendRequests', requestId));
    if (!requestDoc.exists()) return false;

    const request = requestDoc.data() as FriendRequest;

    // Add to both users' friend lists
    const myProfile = await getUserProfile(currentUser.uid);
    const friendProfile = await getUserProfile(request.fromUserId);

    if (!myProfile || !friendProfile) return false;

    // Update both friend lists
    await updateDoc(doc(db, 'users', currentUser.uid), {
      friends: [...myProfile.friends, request.fromUserId],
    });

    await updateDoc(doc(db, 'users', request.fromUserId), {
      friends: [...friendProfile.friends, currentUser.uid],
    });

    // Update request status
    await updateDoc(doc(db, 'friendRequests', requestId), {
      status: 'accepted',
    });

    return true;
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return false;
  }
}

// Reject friend request
export async function rejectFriendRequest(requestId: string): Promise<boolean> {
  try {
    await updateDoc(doc(db, 'friendRequests', requestId), {
      status: 'rejected',
    });
    return true;
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    return false;
  }
}

// Get friend list with profiles
export async function getFriends(): Promise<UserProfile[]> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return [];

    const myProfile = await getUserProfile(currentUser.uid);
    if (!myProfile || myProfile.friends.length === 0) return [];

    // Get all friend profiles
    const friendProfiles = await Promise.all(
      myProfile.friends.map(friendId => getUserProfile(friendId))
    );

    return friendProfiles.filter(profile => profile !== null) as UserProfile[];
  } catch (error) {
    console.error('Error getting friends:', error);
    return [];
  }
}

// Remove friend
export async function removeFriend(friendUserId: string): Promise<boolean> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return false;

    const myProfile = await getUserProfile(currentUser.uid);
    const friendProfile = await getUserProfile(friendUserId);

    if (!myProfile || !friendProfile) return false;

    // Remove from both friend lists
    await updateDoc(doc(db, 'users', currentUser.uid), {
      friends: myProfile.friends.filter(id => id !== friendUserId),
    });

    await updateDoc(doc(db, 'users', friendUserId), {
      friends: friendProfile.friends.filter(id => id !== currentUser.uid),
    });

    return true;
  } catch (error) {
    console.error('Error removing friend:', error);
    return false;
  }
}

// Block a user
export async function blockUser(userIdToBlock: string): Promise<{ success: boolean; message: string }> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, message: 'Not logged in' };
    }

    if (userIdToBlock === currentUser.uid) {
      return { success: false, message: "Can't block yourself" };
    }

    const myProfile = await getUserProfile(currentUser.uid);
    if (!myProfile) {
      return { success: false, message: 'Profile not found' };
    }

    // Check if already blocked
    if (myProfile.blockedUsers?.includes(userIdToBlock)) {
      return { success: false, message: 'User already blocked' };
    }

    // Add to blocked list
    const updatedBlockedUsers = [...(myProfile.blockedUsers || []), userIdToBlock];
    await updateDoc(doc(db, 'users', currentUser.uid), {
      blockedUsers: updatedBlockedUsers,
    });

    // Remove from friends list if they were friends
    if (myProfile.friends.includes(userIdToBlock)) {
      await removeFriend(userIdToBlock);
    }

    // Delete any pending friend requests between the users
    const pendingRequestsFromThem = query(
      collection(db, 'friendRequests'),
      where('fromUserId', '==', userIdToBlock),
      where('toUserId', '==', currentUser.uid),
      where('status', '==', 'pending')
    );
    const pendingRequestsToThem = query(
      collection(db, 'friendRequests'),
      where('fromUserId', '==', currentUser.uid),
      where('toUserId', '==', userIdToBlock),
      where('status', '==', 'pending')
    );

    const [fromThemSnapshot, toThemSnapshot] = await Promise.all([
      getDocs(pendingRequestsFromThem),
      getDocs(pendingRequestsToThem),
    ]);

    const deletePromises = [
      ...fromThemSnapshot.docs.map(doc => deleteDoc(doc.ref)),
      ...toThemSnapshot.docs.map(doc => deleteDoc(doc.ref)),
    ];

    await Promise.all(deletePromises);

    return { success: true, message: 'User blocked successfully' };
  } catch (error) {
    console.error('Error blocking user:', error);
    return { success: false, message: 'Failed to block user' };
  }
}

// Unblock a user
export async function unblockUser(userIdToUnblock: string): Promise<{ success: boolean; message: string }> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, message: 'Not logged in' };
    }

    const myProfile = await getUserProfile(currentUser.uid);
    if (!myProfile) {
      return { success: false, message: 'Profile not found' };
    }

    // Check if actually blocked
    if (!myProfile.blockedUsers?.includes(userIdToUnblock)) {
      return { success: false, message: 'User is not blocked' };
    }

    // Remove from blocked list
    const updatedBlockedUsers = myProfile.blockedUsers.filter(id => id !== userIdToUnblock);
    await updateDoc(doc(db, 'users', currentUser.uid), {
      blockedUsers: updatedBlockedUsers,
    });

    return { success: true, message: 'User unblocked successfully' };
  } catch (error) {
    console.error('Error unblocking user:', error);
    return { success: false, message: 'Failed to unblock user' };
  }
}

// Get list of blocked users
export async function getBlockedUsers(): Promise<UserProfile[]> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return [];

    const myProfile = await getUserProfile(currentUser.uid);
    if (!myProfile || !myProfile.blockedUsers || myProfile.blockedUsers.length === 0) {
      return [];
    }

    // Get all blocked user profiles
    const blockedProfiles = await Promise.all(
      myProfile.blockedUsers.map(userId => getUserProfile(userId))
    );

    return blockedProfiles.filter(profile => profile !== null) as UserProfile[];
  } catch (error) {
    console.error('Error getting blocked users:', error);
    return [];
  }
}

// Submit daily score
export async function submitDailyScore(
  date: string,
  difficulty: string,
  timeSeconds: number,
  hintsUsed: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, error: 'Not logged in' };
    }

    // Validate date
    const dateValidation = validateDate(date);
    if (!dateValidation.isValid) {
      return { success: false, error: dateValidation.error };
    }

    // Validate score
    const scoreValidation = validateScore(timeSeconds, hintsUsed, difficulty);
    if (!scoreValidation.isValid) {
      return { success: false, error: scoreValidation.error };
    }

    // Check rate limit
    const rateLimitKey = `score_submission_${currentUser.uid}`;
    if (!rateLimiter.isAllowed(
      rateLimitKey,
      RATE_LIMITS.SCORE_SUBMISSION.maxActions,
      RATE_LIMITS.SCORE_SUBMISSION.windowMs
    )) {
      const retryAfter = rateLimiter.getRetryAfter(
        rateLimitKey,
        RATE_LIMITS.SCORE_SUBMISSION.maxActions,
        RATE_LIMITS.SCORE_SUBMISSION.windowMs
      );
      const minutesLeft = Math.ceil(retryAfter / 60000);
      return {
        success: false,
        error: `Too many score submissions. Please wait ${minutesLeft} minutes.`,
      };
    }

    const myProfile = await getUserProfile(currentUser.uid);
    if (!myProfile) {
      return { success: false, error: 'Profile not found' };
    }

    const scoreData: Omit<DailyScore, 'id'> = {
      userId: currentUser.uid,
      username: myProfile.username,
      avatar: myProfile.avatar,
      profileColor: myProfile.profileColor,
      date,
      difficulty,
      timeSeconds,
      hintsUsed,
      completed: true,
      completedAt: serverTimestamp(),
    };

    // Use date-userId-difficulty as document ID for uniqueness
    const scoreId = `${date}_${currentUser.uid}_${difficulty}`;
    await setDoc(doc(db, 'scores', scoreId), scoreData);

    return { success: true };
  } catch (error) {
    console.error('Error submitting score:', error);
    return { success: false, error: 'Failed to submit score' };
  }
}

// Get friends' scores for a specific date and difficulty
export async function getFriendsScores(date: string, difficulty: string): Promise<DailyScore[]> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return [];

    const friends = await getFriends();
    if (friends.length === 0) return [];

    // Get my profile to include my own score
    const myProfile = await getUserProfile(currentUser.uid);
    if (!myProfile) return [];

    // Include self in the list
    const allUserIds = [currentUser.uid, ...friends.map(f => f.userId)];

    // Get scores for all friends + self
    const q = query(
      collection(db, 'scores'),
      where('date', '==', date),
      where('difficulty', '==', difficulty)
    );

    const querySnapshot = await getDocs(q);
    const allScores = querySnapshot.docs.map(doc => doc.data() as DailyScore);

    // Filter to only include friends + self
    const friendScores = allScores.filter(score => allUserIds.includes(score.userId));

    // Sort by time (fastest first)
    return friendScores.sort((a, b) => a.timeSeconds - b.timeSeconds);
  } catch (error) {
    console.error('Error getting friends scores:', error);
    return [];
  }
}

// Get global leaderboard scores for a specific date and difficulty
export async function getGlobalScores(date: string, difficulty: string, limit: number = 100): Promise<DailyScore[]> {
  try {
    const q = query(
      collection(db, 'scores'),
      where('date', '==', date),
      where('difficulty', '==', difficulty)
    );

    const querySnapshot = await getDocs(q);
    const allScores = querySnapshot.docs.map(doc => doc.data() as DailyScore);

    // Sort by time (fastest first) and limit results
    return allScores
      .sort((a, b) => a.timeSeconds - b.timeSeconds)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting global scores:', error);
    return [];
  }
}

// Get all-time best scores (across all dates for a difficulty)
export async function getAllTimeBestScores(difficulty: string, limit: number = 100): Promise<DailyScore[]> {
  try {
    const q = query(
      collection(db, 'scores'),
      where('difficulty', '==', difficulty)
    );

    const querySnapshot = await getDocs(q);
    const allScores = querySnapshot.docs.map(doc => doc.data() as DailyScore);

    // Sort by time (fastest first) and limit results
    return allScores
      .sort((a, b) => a.timeSeconds - b.timeSeconds)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting all-time best scores:', error);
    return [];
  }
}
