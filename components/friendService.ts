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

export interface UserProfile {
  userId: string;
  username: string;
  friendCode: string;
  createdAt: any;
  friends: string[]; // Array of friend userIds
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
  date: string;
  difficulty: string;
  timeSeconds: number;
  hintsUsed: number;
  completed: boolean;
  completedAt: any;
}

// Generate a random 6-character friend code
function generateFriendCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Initialize auth and create/load user profile
export async function initializeUser(username?: string): Promise<UserProfile | null> {
  try {
    // Sign in anonymously
    const userCredential = await signInAnonymously(auth);
    const userId = userCredential.user.uid;

    // Check if profile already exists
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (userDoc.exists()) {
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
      createdAt: serverTimestamp(),
      friends: [],
    };

    await setDoc(doc(db, 'users', userId), profile);
    
    // Save to local storage
    await AsyncStorage.setItem('userProfile', JSON.stringify(profile));
    
    return profile;
  } catch (error) {
    console.error('Error initializing user:', error);
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

// Submit daily score
export async function submitDailyScore(
  date: string,
  difficulty: string,
  timeSeconds: number,
  hintsUsed: number
): Promise<boolean> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return false;

    const myProfile = await getUserProfile(currentUser.uid);
    if (!myProfile) return false;

    const scoreData: Omit<DailyScore, 'id'> = {
      userId: currentUser.uid,
      username: myProfile.username,
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

    return true;
  } catch (error) {
    console.error('Error submitting score:', error);
    return false;
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
