import React, { useState, useEffect, useRef } from 'react';
import { Home, Search, Library, PlusSquare, Heart, Download, Play, SkipBack, SkipForward, Repeat, Shuffle, Volume2, ListMusic, User, MoreHorizontal, Clock, Sparkles, Loader2, Languages, X, CheckCircle2, Wand2, Sliders, LogOut, Camera, Save, Share2, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactPlayer from 'react-player';
const Player = ReactPlayer as any;
import { Song, Playlist } from './types';
import { cn, formatTime } from './utils';
import { useAudio } from './hooks/useAudio';
import { getRecommendedSongs, getSongLyrics, getAuraXChat, getSongMetadataFromUrl } from './services/gemini';
import { auth, signInWithGoogle, db, handleFirestoreError, OperationType, signInWithApple } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, signOut, updateProfile, updateEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// Mock data for initial state
const MOCK_SONGS: Song[] = [
  {
    id: 'arijit-1',
    title: 'Tum Hi Ho',
    artist: 'Arijit Singh',
    album: 'Aashiqui 2',
    coverUrl: 'https://upload.wikimedia.org/wikipedia/en/5/52/Aashiqui_2_%28soundtrack%29.jpg',
    duration: 262,
    audioUrl: 'https://www.youtube.com/watch?v=Umqb9KENgmk',
    releaseDate: '2013-04-26',
    genre: 'Bollywood',
    isExternal: true
  },
  {
    id: 'rahman-1',
    title: 'Jai Ho',
    artist: 'A.R. Rahman',
    album: 'Slumdog Millionaire',
    coverUrl: 'https://upload.wikimedia.org/wikipedia/en/d/df/Slumdog_Millionaire_film_poster.jpg',
    duration: 319,
    audioUrl: 'https://www.youtube.com/watch?v=xwwAVRyN2KY',
    releaseDate: '2008-11-25',
    genre: 'Soundtrack',
    isExternal: true
  },
  {
    id: 'taylor-1',
    title: 'Shake It Off',
    artist: 'Taylor Swift',
    album: '1989',
    coverUrl: 'https://upload.wikimedia.org/wikipedia/en/f/f6/Taylor_Swift_-_1989.png',
    duration: 242,
    audioUrl: 'https://www.youtube.com/watch?v=nfWlot6h_JM',
    releaseDate: '2014-08-18',
    genre: 'Pop',
    isExternal: true
  },
  {
    id: 'anirudh-1',
    title: 'Arabic Kuthu',
    artist: 'Anirudh Ravichander',
    album: 'Beast',
    coverUrl: 'https://upload.wikimedia.org/wikipedia/en/2/23/Arabic_Kuthu_Poster.jpg',
    duration: 280,
    audioUrl: 'https://www.youtube.com/watch?v=KUN5Uf9mObQ',
    releaseDate: '2022-02-14',
    genre: 'Tamil Pop',
    isExternal: true
  },
  {
    id: 'weeknd-1',
    title: 'Starboy',
    artist: 'The Weeknd',
    album: 'Starboy',
    coverUrl: 'https://upload.wikimedia.org/wikipedia/en/3/39/The_Weeknd_-_Starboy.png',
    duration: 230,
    audioUrl: 'https://www.youtube.com/watch?v=34Na4j8AVgA',
    releaseDate: '2016-09-21',
    genre: 'R&B',
    isExternal: true
  },
  {
    id: 'drake-1',
    title: 'Hotline Bling',
    artist: 'Drake',
    album: 'Views',
    coverUrl: 'https://upload.wikimedia.org/wikipedia/en/c/c9/Hotline_Bling_Drake.jpg',
    duration: 267,
    audioUrl: 'https://www.youtube.com/watch?v=uxpDa-c-4Mc',
    releaseDate: '2015-07-31',
    genre: 'Hip Hop',
    isExternal: true
  },
  {
    id: 'dua-1',
    title: 'Don\'t Start Now',
    artist: 'Dua Lipa',
    album: 'Future Nostalgia',
    coverUrl: 'https://upload.wikimedia.org/wikipedia/en/f/f5/Dua_Lipa_-_Future_Nostalgia_%28Official_Album_Cover%29.png',
    duration: 183,
    audioUrl: 'https://www.youtube.com/watch?v=oygrmJFKYZY',
    releaseDate: '2019-10-31',
    genre: 'Disco',
    isExternal: true
  },
  {
    id: 'diljit-1',
    title: 'Proper Patola',
    artist: 'Diljit Dosanjh',
    album: 'Namaste England',
    coverUrl: 'https://upload.wikimedia.org/wikipedia/en/a/ab/Proper_Patola_poster.jpg',
    duration: 178,
    audioUrl: 'https://www.youtube.com/watch?v=m7S88h7w6oM',
    releaseDate: '2018-10-03',
    genre: 'Punjabi',
    isExternal: true
  },
  {
    id: 'atif-1',
    title: 'Pehli Nazar Mein',
    artist: 'Atif Aslam',
    album: 'Race',
    coverUrl: 'https://upload.wikimedia.org/wikipedia/en/f/fc/Race_Album_Cover.jpg',
    duration: 312,
    audioUrl: 'https://www.youtube.com/watch?v=pAnFasY9Vv4',
    releaseDate: '2008-03-21',
    genre: 'Bollywood',
    isExternal: true
  },
  {
    id: 'bieber-1',
    title: 'Peaches',
    artist: 'Justin Bieber',
    album: 'Justice',
    coverUrl: 'https://upload.wikimedia.org/wikipedia/en/0/08/Justin_Bieber_-_Justice.png',
    duration: 198,
    audioUrl: 'https://www.youtube.com/watch?v=tQ0yjYUFKAE',
    releaseDate: '2021-03-19',
    genre: 'Pop',
    isExternal: true
  },
  {
    id: 'colplay-1',
    title: 'Hymn For The Weekend',
    artist: 'Coldplay',
    album: 'A Head Full of Dreams',
    coverUrl: 'https://upload.wikimedia.org/wikipedia/en/3/3d/Coldplay_-_A_Head_Full_of_Dreams.png',
    duration: 258,
    audioUrl: 'https://www.youtube.com/watch?v=YykjpeuMNEk',
    releaseDate: '2016-01-25',
    genre: 'Rock',
    isExternal: true
  },
  {
    id: 'sid-1',
    title: 'Kannaana Kanney',
    artist: 'Sid Sriram',
    album: 'Viswasam',
    coverUrl: 'https://upload.wikimedia.org/wikipedia/en/e/e0/Viswasam_poster.jpg',
    duration: 269,
    audioUrl: 'https://www.youtube.com/watch?v=7uS9vtoLgR0',
    releaseDate: '2019-01-10',
    genre: 'Tamil',
    isExternal: true
  },
  {
    id: '13',
    title: 'Na Chinna Pillave',
    artist: 'Hariharan',
    album: 'Youth',
    coverUrl: 'https://upload.wikimedia.org/wikipedia/en/9/91/Youth_2002_film_poster.jpg',
    duration: 335,
    audioUrl: 'https://www.youtube.com/watch?v=F03v5vJ_v0I',
    releaseDate: '2002-07-19',
    genre: 'Tollywood',
    isExternal: true
  },
  {
    id: '14',
    title: 'Natu Natu',
    artist: 'Rahul Sipligunj, Kaala Bhairava',
    album: 'RRR',
    coverUrl: 'https://upload.wikimedia.org/wikipedia/en/2/23/RRR_Poster.jpg',
    duration: 215,
    audioUrl: 'https://www.youtube.com/watch?v=OsU0CGZoV8E',
    releaseDate: '2022-03-25',
    genre: 'Tollywood',
    isExternal: true
  },
  {
    id: '15',
    title: 'Butta Bomma',
    artist: 'Armaan Malik',
    album: 'Ala Vaikunthapurramuloo',
    coverUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a2/Ala_Vaikunthapurramuloo.jpg',
    duration: 197,
    audioUrl: 'https://www.youtube.com/watch?v=2mDCVzL9w4U',
    releaseDate: '2020-02-24',
    genre: 'Tollywood',
    isExternal: true
  },
  {
    id: '16',
    title: 'Samajavaragamana',
    artist: 'Sid Sriram',
    album: 'Ala Vaikunthapurramuloo',
    coverUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a2/Ala_Vaikunthapurramuloo.jpg',
    duration: 221,
    audioUrl: 'https://www.youtube.com/watch?v=me6aoX0wXq8',
    releaseDate: '2019-09-27',
    genre: 'Tollywood',
    isExternal: true
  },
  {
    id: '17',
    title: 'Oo Antava Mawa',
    artist: 'Indravathi Chauhan',
    album: 'Pushpa: The Rise',
    coverUrl: 'https://upload.wikimedia.org/wikipedia/en/7/75/Pushpa_The_Rise_film_poster.jpg',
    duration: 228,
    audioUrl: 'https://www.youtube.com/watch?v=R9reV97XvN8',
    releaseDate: '2021-12-10',
    genre: 'Tollywood',
    isExternal: true
  },
  {
    id: '18',
    title: 'Srivalli',
    artist: 'Sid Sriram',
    album: 'Pushpa: The Rise',
    coverUrl: 'https://upload.wikimedia.org/wikipedia/en/7/75/Pushpa_The_Rise_film_poster.jpg',
    duration: 224,
    audioUrl: 'https://www.youtube.com/watch?v=hcMzwMr77qI',
    releaseDate: '2021-10-13',
    genre: 'Tollywood',
    isExternal: true
  },
  {
    id: '19',
    title: 'Bullet Song',
    artist: 'Silambarasan TR',
    album: 'The Warriorr',
    coverUrl: 'https://upload.wikimedia.org/wikipedia/en/5/50/The_Warriorr_poster.jpg',
    duration: 228,
    audioUrl: 'https://www.youtube.com/watch?v=yY9S7F27YXY',
    releaseDate: '2022-04-22',
    genre: 'Tollywood',
    isExternal: true
  },
  {
    id: '20',
    title: 'Ramuloo Ramulaa',
    artist: 'Anurag Kulkarni',
    album: 'Ala Vaikunthapurramuloo',
    coverUrl: 'https://upload.wikimedia.org/wikipedia/en/a/a2/Ala_Vaikunthapurramuloo.jpg',
    duration: 261,
    audioUrl: 'https://www.youtube.com/watch?v=grrpg_r1Nb8',
    releaseDate: '2019-10-25',
    genre: 'Tollywood',
    isExternal: true
  },
  {
    id: '21',
    title: 'Vachindamma',
    artist: 'Sid Sriram',
    album: 'Geetha Govindam',
    coverUrl: 'https://upload.wikimedia.org/wikipedia/en/d/dd/Geetha_Govindam_poster.jpg',
    duration: 251,
    audioUrl: 'https://www.youtube.com/watch?v=x7f_A_OQnZM',
    releaseDate: '2018-05-04',
    genre: 'Tollywood',
    isExternal: true
  },
  {
    id: '22',
    title: 'Kalaavathi',
    artist: 'Sid Sriram',
    album: 'Sarkaru Vaari Paata',
    coverUrl: 'https://upload.wikimedia.org/wikipedia/en/1/10/Sarkaru_Vaari_Paata_film_poster.jpg',
    duration: 247,
    audioUrl: 'https://www.youtube.com/watch?v=sS_mC6D5g_c',
    releaseDate: '2022-02-13',
    genre: 'Tollywood',
    isExternal: true
  },
  {
    id: '23',
    title: 'Inkem Inkem Kaavaale',
    artist: 'Sid Sriram',
    album: 'Geetha Govindam',
    coverUrl: 'https://upload.wikimedia.org/wikipedia/en/d/dd/Geetha_Govindam_poster.jpg',
    duration: 268,
    audioUrl: 'https://www.youtube.com/watch?v=8VnZ_Y-vH-w',
    releaseDate: '2018-07-10',
    genre: 'Tollywood',
    isExternal: true
  },
  {
    id: '24',
    title: 'Priyathama Priyathama',
    artist: 'Chinmayi Sripaada',
    album: 'Majili',
    coverUrl: 'https://upload.wikimedia.org/wikipedia/en/1/1a/Majili_film_poster.jpg',
    duration: 245,
    audioUrl: 'https://www.youtube.com/watch?v=68f_AFT4HkE',
    releaseDate: '2019-03-11',
    genre: 'Tollywood',
    isExternal: true
  },
  {
    id: '25',
    title: 'Oh Penne',
    artist: 'Anirudh Ravichander',
    album: 'Vanakkam Chennai',
    coverUrl: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a1?w=300&h=300&fit=crop',
    duration: 275,
    audioUrl: 'https://www.youtube.com/watch?v=2T6L8l6bB6E',
    releaseDate: '2013-09-27',
    genre: 'South Pop',
    isExternal: true
  },
  {
    id: '26',
    title: 'Rowdy Baby',
    artist: 'Dhanush, Dhee',
    album: 'Maari 2',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop',
    duration: 282,
    audioUrl: 'https://www.youtube.com/watch?v=x6Q7c9AyM28',
    releaseDate: '2018-12-21',
    genre: 'South Pop',
    isExternal: true
  },
  {
    id: '27',
    title: 'Mellaga Karagani',
    artist: 'SPB Charan, Chitra',
    album: 'Varsham',
    coverUrl: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=300&h=300&fit=crop',
    duration: 324,
    audioUrl: 'https://www.youtube.com/watch?v=0kNo_u6R_2k',
    releaseDate: '2004-01-14',
    genre: 'Tollywood',
    isExternal: true
  },
];

const POPULAR_ARTISTS = [
  { name: "Arijit Singh", roles: ["Singer", "Heartbeat of Bollywood"], image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=400&h=400" },
  { name: "A.R. Rahman", roles: ["Composer", "Legendary Maestro"], image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=400&h=400" },
  { name: "Taylor Swift", roles: ["Global Icon", "Songwriter"], image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=400&h=400" },
  { name: "Anirudh Ravichander", roles: ["Rockstar", "Hitmaker"], image: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=400&h=400" },
  { name: "Shreya Ghoshal", roles: ["Melody Queen", "Vocalist"], image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400&h=400" },
  { name: "The Weeknd", roles: ["R&B Star", "Producer"], image: "https://images.unsplash.com/photo-1459749411177-042180ceea72?auto=format&fit=crop&q=80&w=400&h=400" },
  { name: "Drake", roles: ["Hip Hop King", "Rapper"], image: "https://images.unsplash.com/photo-1605648916319-cf082f7524a1?auto=format&fit=crop&q=80&w=400&h=400" },
  { name: "Atif Aslam", roles: ["Vocal Powerhouse"], image: "https://images.unsplash.com/photo-1510915361894-db8b60106dfc?auto=format&fit=crop&q=80&w=400&h=400" },
  { name: "Dua Lipa", roles: ["Pop Sensation"], image: "https://images.unsplash.com/photo-1514705115967-812ca42bc30a?auto=format&fit=crop&q=80&w=400&h=400" },
  { name: "Sid Sriram", roles: ["Soulful", "Multilingual"], image: "https://images.unsplash.com/photo-1511735111819-9a3f7709049c?auto=format&fit=crop&q=80&w=400&h=400" },
  { name: "Diljit Dosanjh", roles: ["Punjabi Global Star"], image: "https://images.unsplash.com/photo-1520127870598-4a5eb5822826?auto=format&fit=crop&q=80&w=400&h=400" },
  { name: "Harris Jayaraj", roles: ["Melody Maker"], image: "https://images.unsplash.com/photo-1514525253344-f814d074e015?auto=format&fit=crop&q=80&w=400&h=400" },
  { name: "Yuvan Shankar Raja", roles: ["Music Maverick"], image: "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&q=80&w=400&h=400" },
  { name: "Justin Bieber", roles: ["Pop Icon"], image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400&h=400" },
  { name: "Armaan Malik", roles: ["Youth Icon"], image: "https://images.unsplash.com/photo-1526218626217-dc65a29bb444?auto=format&fit=crop&q=80&w=400&h=400" },
  { name: "Prateek Kuhad", roles: ["Indie Sensation"], image: "https://images.unsplash.com/photo-1504173010664-32509ac68d30?auto=format&fit=crop&q=80&w=400&h=400" }
];

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);

  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Sync user to Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        try {
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            await setDoc(userRef, {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              selectedArtists: [],
              onboardingCompleted: false
            });
            setOnboardingComplete(false);
          } else {
            const data = userDoc.data();
            setSelectedArtists(data?.selectedArtists || []);
            setOnboardingComplete(!!data?.onboardingCompleted);
            
            // If the user hasn't selected artists yet, ensure they see the selection page
            if (data?.selectedArtists?.length === 0 && !data?.onboardingCompleted) {
              setOnboardingComplete(false);
            }

            await setDoc(userRef, {
              updatedAt: serverTimestamp(),
            }, { merge: true });
          }
        } catch (error) {
          console.error("Auth sync error:", error);
          // Don't let firestore errors block the UI entirely
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const [isPremium, setIsPremium] = useState(() => {
    return localStorage.getItem('melodify_premium') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('melodify_premium', isPremium.toString());
  }, [isPremium]);

  const [currentQueue, setCurrentQueue] = useState<Song[]>(MOCK_SONGS);
  const [currentSong, setCurrentSong] = useState<Song | null>(MOCK_SONGS[0]);
  const playerRef = useRef<any>(null);
  const [volume, setVolume] = useState(0.8);

  const { isPlaying, progress, toggle, seek: internalSeek, setIsPlaying } = useAudio(currentSong, volume, () => playNext(false));

  const seek = (time: number) => {
    internalSeek(time);
    if (currentSong?.isExternal && playerRef.current) {
        playerRef.current.seekTo(time, 'seconds');
    }
  };

  const [isShuffleOn, setIsShuffleOn] = useState(false);
  const toggleShuffle = () => setIsShuffleOn(!isShuffleOn);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const toggleRepeat = () => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  const playNext = (isManual = true) => {
    if (!currentSong) return;
    
    if (!isManual && repeatMode === 'one') {
      seek(0);
      setIsPlaying(true);
      return;
    }

    const availableQueue = !isOnline 
      ? currentQueue.filter(s => downloadedSongs.has(s.id))
      : currentQueue;

    if (availableQueue.length === 0) {
      setIsPlaying(false);
      return;
    }

    const currentIdxInAvailable = availableQueue.findIndex(s => s.id === currentSong.id);
    
    if (currentIdxInAvailable !== -1 && currentIdxInAvailable < availableQueue.length - 1) {
      setCurrentSong(availableQueue[currentIdxInAvailable + 1]);
    } else if (isShuffleOn) {
      setCurrentSong(availableQueue[Math.floor(Math.random() * availableQueue.length)]);
    } else if (repeatMode === 'all' || isManual) {
      setCurrentSong(availableQueue[0]);
    } else {
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
  };

  const playPrevious = () => {
    if (!currentSong) return;
    
    const availableQueue = !isOnline 
      ? currentQueue.filter(s => downloadedSongs.has(s.id))
      : currentQueue;

    if (availableQueue.length === 0) return;

    const currentIdxInAvailable = availableQueue.findIndex(s => s.id === currentSong.id);
    
    if (currentIdxInAvailable > 0) {
      setCurrentSong(availableQueue[currentIdxInAvailable - 1]);
    } else {
      setCurrentSong(availableQueue[availableQueue.length - 1]);
    }
    setIsPlaying(true);
  };

  const [followedPlaylists, setFollowedPlaylists] = useState<Set<string>>(new Set());
  const toggleFollow = (id: string) => {
    setFollowedPlaylists(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const [showSearch, setShowSearch] = useState(false);
  const [aiRecs, setAiRecs] = useState<Song[]>([]);
  const [aiGeneratedSongs, setAiGeneratedSongs] = useState<Song[]>(() => {
    const saved = localStorage.getItem('melodify_ai_songs');
    return saved ? JSON.parse(saved) : [];
  });
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [showArtists, setShowArtists] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showReferral, setShowReferral] = useState(false);

  // Profile Edit State
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhoto, setEditPhoto] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const storedCode = localStorage.getItem(`referral_code_${user.uid}`);
      if (storedCode) {
        setReferralCode(storedCode);
      } else {
        const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        localStorage.setItem(`referral_code_${user.uid}`, newCode);
        setReferralCode(newCode);
      }
    }
  }, [user]);

  useEffect(() => {
    if (user && showProfile) {
      setEditName(user.displayName || "");
      setEditEmail(user.email || "");
      setEditPhoto(user.photoURL || "");
      setProfileUpdateSuccess(false);
    }
  }, [user, showProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsUpdatingProfile(true);
    setAuthError(null);
    setProfileUpdateSuccess(false);

    try {
      // Update Firebase Auth Profile
      await updateProfile(user, {
        displayName: editName,
        photoURL: editPhoto
      });

      // Optionally update Email
      if (editEmail !== user.email) {
        try {
          await updateEmail(user, editEmail);
        } catch (emailErr: any) {
          console.warn("Could not update email (requires recent login):", emailErr);
          setAuthError("Email update failed. You might need to sign in again to change your email.");
        }
      }

      // Sync to Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        displayName: editName,
        photoURL: editPhoto,
        email: editEmail,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setProfileUpdateSuccess(true);
      setTimeout(() => setProfileUpdateSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setAuthError(err.message || "Failed to update profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('melodify_ai_songs', JSON.stringify(aiGeneratedSongs));
  }, [aiGeneratedSongs]);

  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState("");
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [viewingSongLyrics, setViewingSongLyrics] = useState("");
  const [isLoadingViewingLyrics, setIsLoadingViewingLyrics] = useState(false);
  const [showViewingLyrics, setShowViewingLyrics] = useState(false);
  const [viewingSong, setViewingSong] = useState<Song | null>(null);

  const fetchViewingLyrics = async () => {
    if (!viewingSong) return;
    setIsLoadingViewingLyrics(true);
    setShowViewingLyrics(true);
    const l = await getSongLyrics(viewingSong.title, viewingSong.artist);
    setViewingSongLyrics(l);
    setIsLoadingViewingLyrics(false);
  };

  useEffect(() => {
    setViewingSongLyrics("");
    setShowViewingLyrics(false);
  }, [viewingSong]);

  const [history, setHistory] = useState<Song[]>([]);
  const [downloadingSongs, setDownloadingSongs] = useState<Record<string, number>>({});
  const [downloadedSongs, setDownloadedSongs] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('melodify_downloaded');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    localStorage.setItem('melodify_downloaded', JSON.stringify(Array.from(downloadedSongs)));
  }, [downloadedSongs]);

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleDownload = async (song: Song) => {
    if (downloadedSongs.has(song.id) || downloadingSongs[song.id] !== undefined) return;

    setDownloadingSongs(prev => ({ ...prev, [song.id]: 0 }));

    // Simulation for UI feedback
    const startSimulation = async (id: string, actualDownload: boolean = false) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 95 && actualDownload) {
            // Wait for actual download to finish the last 5%
            setDownloadingSongs(prev => ({ ...prev, [id]: 95 }));
        } else if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setDownloadedSongs(prev => new Set(prev).add(id));
          // Store full song metadata for offline access
          const offlineMeta = JSON.parse(localStorage.getItem('melodify_offline_metadata') || '{}');
          offlineMeta[id] = song;
          localStorage.setItem('melodify_offline_metadata', JSON.stringify(offlineMeta));

          setDownloadingSongs(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
        } else {
          setDownloadingSongs(prev => ({ ...prev, [id]: progress }));
        }
      }, 300);
      return interval;
    };

    if (song.isExternal && (song.audioUrl.includes('youtube.com') || song.audioUrl.includes('youtu.be'))) {
      startSimulation(song.id);
      return;
    }

    try {
      const simInterval = await startSimulation(song.id, true);
      
      const response = await fetch(song.audioUrl, { mode: 'cors' });
      if (!response.ok) throw new Error("Fetch failed");
      
      // Store in Cache API for true offline playback
      const cache = await caches.open('melodify-audio-v1');
      await cache.put(song.audioUrl, response.clone());

      clearInterval(simInterval);
      setDownloadedSongs(prev => new Set(prev).add(song.id));
      
      // Store metadata
      const offlineMeta = JSON.parse(localStorage.getItem('melodify_offline_metadata') || '{}');
      offlineMeta[song.id] = song;
      localStorage.setItem('melodify_offline_metadata', JSON.stringify(offlineMeta));

      setDownloadingSongs(prev => {
        const next = { ...prev };
        delete next[song.id];
        return next;
      });
    } catch (error) {
      console.warn("Real download failed (possibly CORS), using local metadata storage only:", error);
      // We already started simulation, it will finish and mark as "downloaded" (metadata only)
    }
  };

  const [isShuffleMode, setIsShuffleMode] = useState(false);

  const [favorites, setFavorites] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('melodify_favorites');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [showDownloaded, setShowDownloaded] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showLyricsQueue, setShowLyricsQueue] = useState(false);
  const [showEqualizer, setShowEqualizer] = useState(false);
  const [eqLevels, setEqLevels] = useState({
    bass: 50,
    mid: 50,
    treble: 50,
    gain: 50
  });
  const [eqPresets, setEqPresets] = useState<{name: string, levels: typeof eqLevels}[]>(() => {
    const saved = localStorage.getItem('melodify_eq_presets');
    return saved ? JSON.parse(saved) : [
      { name: 'Flat', levels: { bass: 50, mid: 50, treble: 50, gain: 50 } },
      { name: 'Bass Boost', levels: { bass: 85, mid: 45, treble: 40, gain: 55 } },
      { name: 'AuraX Crystal', levels: { bass: 40, mid: 60, treble: 90, gain: 50 } }
    ];
  });

  useEffect(() => {
    localStorage.setItem('melodify_eq_presets', JSON.stringify(eqPresets));
  }, [eqPresets]);
  const [lyricsQueue, setLyricsQueue] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('melodify_lyrics_queue');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    localStorage.setItem('melodify_lyrics_queue', JSON.stringify(Array.from(lyricsQueue)));
  }, [lyricsQueue]);

  const toggleLyricsQueue = (songId: string) => {
    setLyricsQueue(prev => {
      const next = new Set(prev);
      if (next.has(songId)) next.delete(songId);
      else next.add(songId);
      return next;
    });
  };
  const [showImportModal, setShowImportModal] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importTitle, setImportTitle] = useState("");
  const [importArtist, setImportArtist] = useState("");
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);

  const fetchMetadata = async () => {
    if (!importUrl) return;
    setIsFetchingMetadata(true);
    try {
      const metadata = await getSongMetadataFromUrl(importUrl);
      if (metadata.title) setImportTitle(metadata.title);
      if (metadata.artist) setImportArtist(metadata.artist);
    } catch (error) {
      console.error("Error fetching metadata:", error);
    } finally {
      setIsFetchingMetadata(false);
    }
  };

  const [importedSongs, setImportedSongs] = useState<Song[]>(() => {
    const saved = localStorage.getItem('melodify_imported');
    return saved ? JSON.parse(saved) : [];
  });

  const [offlineMetadata, setOfflineMetadata] = useState<Record<string, Song>>(() => {
    const saved = localStorage.getItem('melodify_offline_metadata');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('melodify_imported', JSON.stringify(importedSongs));
  }, [importedSongs]);

  useEffect(() => {
    localStorage.setItem('melodify_offline_metadata', JSON.stringify(offlineMetadata));
  }, [offlineMetadata]);

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl || !importTitle) return;

    const newSong: Song = {
      id: `yt-${Date.now()}`,
      title: importTitle,
      artist: importArtist || "Unknown Artist",
      album: "YouTube Import",
      coverUrl: `https://img.youtube.com/vi/${importUrl.split('v=')[1]?.split('&')[0]}/maxresdefault.jpg` || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&h=300&fit=crop',
      duration: 0, // Will be updated on play
      audioUrl: importUrl,
      isExternal: true
    };

    setImportedSongs([...importedSongs, newSong]);
    setImportUrl("");
    setImportTitle("");
    setImportArtist("");
    setShowImportModal(false);
  };

  const toggleFavorite = (songId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(songId)) next.delete(songId);
      else next.add(songId);
      return next;
    });
  };
  
  const allSongs = [...MOCK_SONGS, ...aiGeneratedSongs, ...importedSongs, ...Object.values(offlineMetadata).filter(os => !MOCK_SONGS.find(ms => ms.id === os.id) && !importedSongs.find(is => is.id === os.id))];
  const favoriteSongs = allSongs.filter(s => favorites.has(s.id));

  useEffect(() => {
    if (currentSong) {
      setHistory(prev => {
        const filtered = prev.filter(s => s.id !== currentSong.id);
        return [currentSong, ...filtered].slice(0, 10);
      });
    }
  }, [currentSong]);

  useEffect(() => {
    if (showLyrics && currentSong) {
        setIsLoadingLyrics(true);
        getSongLyrics(currentSong.title, currentSong.artist).then(l => {
            setLyrics(l);
            setIsLoadingLyrics(false);
        });
    }
  }, [currentSong, showLyrics]);

  const handleToggleLyrics = () => {
    setShowLyrics(!showLyrics);
  };

  const handleAiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim() && !selectedGenre && !selectedYear) return;
    
    setIsLoadingRecs(true);
    const recs = await getRecommendedSongs(aiPrompt, history, selectedGenre, selectedYear, selectedArtists);
    // Enrich with mock URLs since Gemini only gives text
    const enrichedRecs = recs.map((r, i) => {
        const mockMatch = MOCK_SONGS[i % MOCK_SONGS.length];
        return {
            ...r,
            id: `ai-${Date.now()}-${i}`,
            coverUrl: `https://picsum.photos/seed/${encodeURIComponent(r.title || '')}/300/300`,
            duration: 180 + Math.floor(Math.random() * 60),
            audioUrl: mockMatch.audioUrl,
            isExternal: mockMatch.isExternal,
            reason: r.reason,
            genre: r.genre,
            releaseDate: r.releaseDate
        } as Song;
    });
    
    setAiRecs(enrichedRecs);
    setAiGeneratedSongs(prev => {
        const next = [...prev];
        enrichedRecs.forEach(r => {
            if (!next.find(s => s.title === r.title && s.artist === r.artist)) {
                next.push(r);
            }
        });
        return next;
    });
    setIsLoadingRecs(false);
  };

  const saveAiRecsAsPlaylist = () => {
    if (aiRecs.length === 0) return;
    const name = aiPrompt ? `AI: ${aiPrompt}` : `AI Mix ${new Date().toLocaleDateString()}`;
    const newPlaylist: Playlist = {
      id: `pl-${Date.now()}`,
      name: name,
      songIds: aiRecs.map(s => s.id!),
      ownerId: 'user',
      createdAt: Date.now(),
    };
    setPlaylists([...playlists, newPlaylist]);
    setAiRecs([]);
    setAiPrompt("");
    setSelectedGenre("");
    setSelectedYear("");
  };

  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const saved = localStorage.getItem('melodify_playlists');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [showSleepTimerMenu, setShowSleepTimerMenu] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sleepTimer !== null && sleepTimer > 0 && isPlaying) {
      interval = setInterval(() => {
        setSleepTimer(prev => {
          if (prev === null || prev <= 0) {
            clearInterval(interval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (sleepTimer === 0) {
      setIsPlaying(false);
      setSleepTimer(null);
    }
    return () => clearInterval(interval);
  }, [sleepTimer, isPlaying]);

  const setTimer = (mins: number) => {
    setSleepTimer(mins * 60);
    setShowSleepTimerMenu(false);
  };

  const formatSleepTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const [showAuraX, setShowAuraX] = useState(false);
  const [auraXMessages, setAuraXMessages] = useState<{ role: 'user' | 'auraX', text: string }[]>([
    { role: 'auraX', text: "Hello! I'm AuraX, your musical co-pilot. I can tell you about the current track, suggest what to listen to next, or just talk music. What's on your mind?" }
  ]);
  const [auraXInput, setAuraXInput] = useState("");
  const [isAuraXLoading, setIsAuraXLoading] = useState(false);

  const handleAuraXSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!auraXInput.trim() || isAuraXLoading) return;

    const userMsg = auraXInput.trim();
    setAuraXInput("");
    setAuraXMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsAuraXLoading(true);

    const response = await getAuraXChat(userMsg, auraXMessages, currentSong, history, selectedArtists);
    setAuraXMessages(prev => [...prev, { role: 'auraX', text: response }]);
    setIsAuraXLoading(false);
  };

  useEffect(() => {
    localStorage.setItem('melodify_playlists', JSON.stringify(playlists));
  }, [playlists]);

  const createPlaylist = () => {
    const newPlaylist: Playlist = {
      id: `pl-${Date.now()}`,
      name: `My Playlist #${playlists.length + 1}`,
      songIds: [],
      ownerId: 'guest',
      createdAt: Date.now()
    };
    setPlaylists([...playlists, newPlaylist]);
    setSelectedPlaylistId(newPlaylist.id);
  };

  const deletePlaylist = (id: string) => {
    setPlaylists(playlists.filter(p => p.id !== id));
    if (selectedPlaylistId === id) setSelectedPlaylistId(null);
  };

  const renamePlaylist = (id: string, newName: string) => {
    setPlaylists(playlists.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  const addToPlaylist = (playlistId: string, songId: string) => {
    setPlaylists(playlists.map(p => {
      if (p.id === playlistId && !p.songIds.includes(songId)) {
        return { ...p, songIds: [...p.songIds, songId] };
      }
      return p;
    }));
  };

  const removeFromPlaylist = (playlistId: string, songId: string) => {
    setPlaylists(playlists.map(p => {
      if (p.id === playlistId) {
        return { ...p, songIds: p.songIds.filter(id => id !== songId) };
      }
      return p;
    }));
  };

  const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId);
  const playlistSongs = selectedPlaylist 
    ? allSongs.filter(s => selectedPlaylist.songIds.includes(s.id))
    : [];

  const togglePlay = () => toggle();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const handleSaveArtists = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        selectedArtists,
        onboardingCompleted: true,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setOnboardingComplete(true);
      // Redirect to Home screen state - Reset all view flags
      setShowSearch(false);
      setShowArtists(false);
      setSelectedPlaylistId(null);
      setShowFavorites(false);
      setViewingSong(null);
      setShowDownloaded(false);
      setShowAiGenerator(false);
      setShowAuraX(false);
      setShowLyricsQueue(false);
      setShowViewingLyrics(false);
      setShowLyrics(false);
      setShowImportModal(false);
    } catch (error) {
      console.error("Error saving artists", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleArtist = (artist: string) => {
    setSelectedArtists(prev => 
      prev.includes(artist) ? prev.filter(a => a !== artist) : [...prev, artist]
    );
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#FF0000] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Atmospheric background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#FF0000]/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse delay-1000" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="z-10 text-center px-6"
        >
          <div className="flex items-center justify-center mb-8">
            <div className="w-16 h-16 bg-[#FF0000] rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,0,0,0.3)]">
              <Play className="w-8 h-8 text-black fill-current ml-1" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">AuraX</h1>
          <p className="text-white text-[10px] font-black uppercase tracking-[0.3em] mb-6">Founded by Roshan.R.Soyam</p>
          <p className="text-zinc-400 text-lg mb-12 max-w-md mx-auto">
            Your personal AI-powered music companion. Listen, discover, and create with the power of AuraX.
          </p>

          <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
            <button
              id="google-login-btn"
              onClick={signInWithGoogle}
              className="group relative flex items-center justify-center gap-4 bg-white text-black font-bold py-4 px-8 rounded-full hover:scale-105 transition-all duration-300 shadow-[0_4px_20px_rgba(255,255,255,0.1)] overflow-hidden"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 z-10" />
              <span className="z-10">Continue with Google</span>
            </button>

            <button
              onClick={signInWithApple}
              className="group relative flex items-center justify-center gap-4 bg-black text-white border border-white/20 font-bold py-4 px-8 rounded-full hover:scale-105 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.3)] overflow-hidden"
            >
              <svg className="w-5 h-5 z-10 fill-current" viewBox="0 0 384 512">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
              </svg>
              <span className="z-10">Continue with Apple</span>
            </button>

            <div className="flex justify-center gap-6 mt-4">
               <button title="Instagram (Placeholder)" className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-bold">IG</span>
               </button>
               <button title="Facebook (Placeholder)" className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-bold">FB</span>
               </button>
            </div>
          </div>
          
          <p className="mt-8 text-zinc-600 text-xs uppercase tracking-widest font-semibold">
            Powered by Gemini & Firebase
          </p>
        </motion.div>

        {/* Floating cards for visual interest */}
        <div className="absolute top-1/4 -right-12 opacity-20 rotate-12 hidden lg:block">
            <div className="w-48 h-48 bg-zinc-800 rounded-xl border border-zinc-700 shadow-2xl" />
        </div>
        <div className="absolute bottom-1/4 -left-12 opacity-20 -rotate-12 hidden lg:block">
            <div className="w-48 h-48 bg-zinc-800 rounded-xl border border-zinc-700 shadow-2xl" />
        </div>
      </div>
    );
  }

  if (!onboardingComplete) {
    return (
      <div className="h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden p-6 selection:bg-[#FF0000]/30">
        <div className="absolute top-8 right-8 z-20">
          <button 
            onClick={handleSaveArtists}
            className="text-zinc-500 hover:text-white transition-colors flex items-center gap-2 group text-sm font-bold uppercase tracking-widest"
          >
            Skip
            <SkipForward className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="z-10 text-center max-w-4xl w-full"
        >
          <div className="flex items-center justify-center mb-8">
            <div className="p-4 bg-[#FF0000]/10 rounded-full">
              <Sparkles className="w-12 h-12 text-[#FF0000] animate-pulse" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Choose your favorite artists</h1>
          <p className="text-zinc-400 text-lg mb-4 max-w-md mx-auto">
            AuraX uses this to understand your vibe and recommend the perfect tracks for you.
          </p>
          <div className="mb-12">
            <p className={cn(
                "text-xs font-bold uppercase tracking-[0.2em] transition-colors",
                selectedArtists.length >= 3 ? "text-[#FF0000]" : "text-orange-500"
            )}>
                {selectedArtists.length < 3 
                    ? `Select at least ${3 - selectedArtists.length} more artist${3 - selectedArtists.length === 1 ? '' : 's'}` 
                    : "Ready to groove!"}
            </p>
            <div className="w-48 h-1 bg-white/10 mx-auto mt-4 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((selectedArtists.length / 3) * 100, 100)}%` }}
                    className="h-full bg-[#FF0000]"
                />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-12 max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar p-1">
            {POPULAR_ARTISTS.map(artist => (
              <motion.button
                key={artist.name}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleArtist(artist.name)}
                className={cn(
                  "flex flex-col items-center gap-4 p-4 rounded-3xl transition-all duration-300 border-2 group relative",
                  selectedArtists.includes(artist.name) 
                    ? "bg-[#FF0000]/10 border-[#FF0000] shadow-[0_0_30px_rgba(255,0,0,0.15)]" 
                    : "bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10"
                )}
              >
                <div className="relative w-24 h-24 sm:w-32 sm:h-32">
                  <img 
                    src={artist.image} 
                    alt={artist.name}
                    className="w-full h-full rounded-full object-cover transition-transform duration-500 group-hover:scale-110 shadow-2xl grayscale group-hover:grayscale-0"
                  />
                  {selectedArtists.includes(artist.name) && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-[#FF0000] p-1.5 rounded-full text-black shadow-lg"
                    >
                      <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                    </motion.div>
                  )}
                  <div className="absolute inset-0 rounded-full border-4 border-[#FF0000] opacity-0 group-hover:opacity-20 transition-opacity scale-110" />
                </div>
                <div className="text-center w-full">
                  <p className={cn(
                    "font-black text-sm transition-colors tracking-tight",
                    selectedArtists.includes(artist.name) ? "text-[#FF0000]" : "text-white"
                  )}>{artist.name}</p>
                  <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mt-1 whitespace-nowrap overflow-hidden text-ellipsis px-2">
                    {artist.roles.join(" • ")}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>

          <button
            onClick={handleSaveArtists}
            disabled={selectedArtists.length < 3}
            className="group relative flex items-center justify-center gap-4 bg-white text-black font-bold py-4 px-12 rounded-full hover:scale-105 transition-all duration-300 shadow-[0_4px_20px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed overflow-hidden"
          >
            <div className="absolute inset-0 bg-zinc-100 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="z-10">Start Listening</span>
            <Play className="w-4 h-4 z-10 fill-current" />
          </button>
        </motion.div>

        {/* Decorative background blur */}
        <div className="absolute top-1/2 left-0 w-[50%] h-[50%] bg-[#FF0000]/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px] translate-x-1/4 translate-y-1/4 animate-pulse delay-1000" />

        {/* Lower Right Continue Button */}
        <div className="absolute bottom-8 right-8 z-20">
          <button 
            onClick={handleSaveArtists}
            disabled={selectedArtists.length < 3}
            className="group flex items-center gap-2 bg-[#FF0000] text-black font-bold py-3 px-6 rounded-full hover:scale-105 transition-all duration-300 shadow-[0_4px_15px_rgba(255,0,0,0.3)] disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed uppercase text-xs tracking-widest"
          >
            Continue
            <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#050505] text-[#e0e0e0] font-sans overflow-hidden selection:bg-[#FF0000]/30">
      {/* ReactPlayer for YouTube Imports */}
      <div 
        className="fixed top-0 left-0 w-[1px] h-[1px] opacity-[0.001] pointer-events-none -z-[100] bg-black overflow-hidden"
      >
        {/* Keep player mounted to avoid "play() interrupted" errors */}
        <Player
          ref={playerRef}
          url={currentSong?.isExternal ? currentSong.audioUrl : ''}
          playing={isPlaying && (currentSong?.isExternal ?? false)}
          controls={false}
          width="100%"
          height="100%"
          config={{
            youtube: {
              playerVars: {
                rel: 0,
                iv_load_policy: 3,
                fs: 0
              }
            }
          }}
          playsinline
          pip={false}
          volume={volume}
          onReady={() => {
            console.log("External Player Ready");
            if (playerRef.current && currentSong?.isExternal && currentSong.duration === 0) {
                const d = playerRef.current.getDuration();
                if (d > 0) {
                    setImportedSongs(prev => prev.map(s => s.id === (currentSong?.id || "") ? { ...s, duration: d } : s));
                }
            }
          }}
          onPlay={() => {
              if (currentSong?.isExternal && !isPlaying) setIsPlaying(true);
          }}
          onPause={() => {
              if (currentSong?.isExternal && isPlaying) setIsPlaying(false);
          }}
          onProgress={(state: any) => {
              if (currentSong?.isExternal) {
                  internalSeek(state.playedSeconds);
                  if (currentSong.duration === 0 && playerRef.current) {
                      const d = playerRef.current.getDuration();
                      if (d > 0) {
                          setImportedSongs(prev => prev.map(s => s.id === (currentSong?.id || "") ? { ...s, duration: d } : s));
                      }
                  }
              }
          }}
          onEnded={() => {
              if (currentSong?.isExternal) playNext(false);
          }}
          onError={() => {
            if (currentSong?.isExternal) playNext(false);
          }}
        />
      </div>

      {/* Import Modal */}
      <AnimatePresence>
        {showImportModal && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6"
                onClick={() => setShowImportModal(false)}
            >
                <motion.div 
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-zinc-900 border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-black italic tracking-tighter uppercase">Import from YouTube</h2>
                        <button onClick={() => setShowImportModal(false)} className="text-white/40 hover:text-white"><X className="w-6 h-6" /></button>
                    </div>
                    
                    <form onSubmit={handleImport} className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 block mb-2">Video URL</label>
                            <div className="flex gap-2">
                                <input 
                                    value={importUrl}
                                    onChange={(e) => setImportUrl(e.target.value)}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#FF0000] transition-all"
                                />
                                <button 
                                    type="button"
                                    onClick={fetchMetadata}
                                    disabled={isFetchingMetadata || !importUrl}
                                    className="px-4 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all flex items-center justify-center min-w-[50px]"
                                    title="Auto-fill details using AI"
                                >
                                    {isFetchingMetadata ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4 text-[#FF0000]" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 block mb-2">Song Title</label>
                            <input 
                                value={importTitle}
                                onChange={(e) => setImportTitle(e.target.value)}
                                placeholder="Song Title"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#FF0000] transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 block mb-2">Artist (Optional)</label>
                            <input 
                                value={importArtist}
                                onChange={(e) => setImportArtist(e.target.value)}
                                placeholder="Artist Name"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#FF0000] transition-all"
                            />
                        </div>
                        <button 
                            type="submit"
                            className="w-full bg-[#FF0000] text-black font-black uppercase tracking-widest py-4 rounded-xl mt-4 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            ADD TO LIBRARY
                        </button>
                    </form>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
      {/* Sidebar */}
      <aside className="w-60 bg-[#000000] border-r border-white/5 flex flex-col p-6 shrink-0 h-full">
        <div className="mb-10">
          <div className="flex flex-col">
            <div className="text-[#FF0000] font-bold text-2xl tracking-tighter flex items-center gap-2">
              <div className="w-8 h-8 bg-[#FF0000] rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-black rounded-full"></div>
              </div>
              AURAX
            </div>
            <p className="text-[8px] text-white uppercase tracking-[0.2em] font-black mt-1 ml-10">by Roshan.R.Soyam</p>
          </div>
        </div>

        <nav className="space-y-6">
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold px-1">Library</p>
            <div className="space-y-3">
              <SidebarItem icon={<div className={cn("w-1 h-1 rounded-full", !showSearch && !selectedPlaylistId && !showFavorites && !viewingSong && !showDownloaded && !showAiGenerator && !showArtists && !showProfile && !showReferral ? "bg-[#FF0000]" : "bg-transparent")} />} label="Home" active={!showSearch && !selectedPlaylistId && !showFavorites && !viewingSong && !showDownloaded && !showAiGenerator && !showArtists && !showProfile && !showReferral} onClick={() => { setShowSearch(false); setSelectedPlaylistId(null); setShowFavorites(false); setViewingSong(null); setShowDownloaded(false); setShowAiGenerator(false); setShowArtists(false); setShowProfile(false); setShowReferral(false); }} />
              <SidebarItem icon={<div className={cn("w-1 h-1 rounded-full", showSearch ? "bg-[#FF0000]" : "bg-transparent")} />} label="Discover" active={showSearch} onClick={() => { setShowSearch(true); setSelectedPlaylistId(null); setShowFavorites(false); setViewingSong(null); setShowDownloaded(false); setShowAiGenerator(false); setShowArtists(false); setShowProfile(false); setShowReferral(false); }} />
              <SidebarItem icon={<div className={cn("w-1 h-1 rounded-full", showFavorites ? "bg-[#FF0000]" : "bg-transparent")} />} label="Liked Songs" active={showFavorites} onClick={() => { setShowFavorites(true); setShowSearch(false); setSelectedPlaylistId(null); setViewingSong(null); setShowDownloaded(false); setShowAiGenerator(false); setShowArtists(false); setShowProfile(false); setShowReferral(false); }} />
              <SidebarItem icon={<User className={cn("w-3.5 h-3.5", showArtists ? "text-[#FF0000]" : "text-white/50")} />} label="Artists" active={showArtists} onClick={() => { setShowArtists(true); setShowSearch(false); setShowFavorites(false); setSelectedPlaylistId(null); setViewingSong(null); setShowDownloaded(false); setShowAiGenerator(false); setShowProfile(false); setShowReferral(false); }} />
              <SidebarItem icon={<div className={cn("w-3.5 h-3.5 rounded-full border border-white/20 flex items-center justify-center text-[8px] font-bold", showProfile ? "bg-[#FF0000]/20 text-[#FF0000] border-[#FF0000]/50" : "text-white/50")}>{user?.displayName?.charAt(0) || 'U'}</div>} label="Profile" active={showProfile} onClick={() => { setShowProfile(true); setShowArtists(false); setShowSearch(false); setShowFavorites(false); setSelectedPlaylistId(null); setViewingSong(null); setShowDownloaded(false); setShowAiGenerator(false); setShowReferral(false); }} />
              <SidebarItem icon={<Share2 className={cn("w-3.5 h-3.5", showReferral ? "text-[#FF0000]" : "text-white/50")} />} label="Refer a Friend" active={showReferral} onClick={() => { setShowReferral(true); setShowProfile(false); setShowArtists(false); setShowSearch(false); setShowFavorites(false); setSelectedPlaylistId(null); setViewingSong(null); setShowDownloaded(false); setShowAiGenerator(false); }} />
              <SidebarItem icon={<Download className={cn("w-3.5 h-3.5", showDownloaded ? "text-[#FF0000]" : "text-white/50")} />} label="Downloaded" active={showDownloaded} onClick={() => { setShowDownloaded(true); setShowFavorites(false); setShowSearch(false); setSelectedPlaylistId(null); setViewingSong(null); setShowLyricsQueue(false); setShowAiGenerator(false); setShowArtists(false); setShowProfile(false); setShowReferral(false); }} />
              <SidebarItem icon={<ListMusic className={cn("w-4 h-4", showLyricsQueue ? "text-[#FF0000]" : "text-white/50")} />} label="Lyrics Queue" active={showLyricsQueue} onClick={() => { setShowLyricsQueue(true); setShowDownloaded(false); setShowFavorites(false); setShowSearch(false); setSelectedPlaylistId(null); setViewingSong(null); setShowProfile(false); setShowReferral(false); }} />
              <SidebarItem icon={<Sparkles className={cn("w-4 h-4", showAuraX ? "text-[#FF0000]" : "text-white/50")} />} label="AuraX Assistant" active={showAuraX} onClick={() => { setShowAuraX(!showAuraX); setShowSearch(false); setShowFavorites(false); setSelectedPlaylistId(null); setShowDownloaded(false); setShowLyricsQueue(false); setShowProfile(false); setShowReferral(false); }} />
              <SidebarItem icon={<PlusSquare className="w-4 h-4 text-white/50" />} label="Import URL" active={false} onClick={() => setShowImportModal(true)} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">Playlists</p>
              <button 
                onClick={createPlaylist}
                className="text-white/30 hover:text-[#FF0000] transition-colors"
              >
                <PlusSquare className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-3 px-1 text-sm max-h-48 overflow-y-auto scrollbar-hide">
              {playlists.map((playlist) => (
                <p 
                  key={playlist.id} 
                  onClick={() => { setSelectedPlaylistId(playlist.id); setShowSearch(false); setViewingSong(null); setShowProfile(false); setShowFavorites(false); setShowArtists(false); setShowDownloaded(false); setShowAiGenerator(false); setShowReferral(false); }}
                  className={cn(
                    "cursor-pointer transition-colors line-clamp-1 italic",
                    selectedPlaylistId === playlist.id ? "text-[#FF0000]" : "text-white/50 hover:text-white"
                  )}
                >
                  {playlist.name}
                </p>
              ))}
              {playlists.length === 0 && (
                <p className="text-[10px] text-white/20 italic tracking-wider">No playlists yet</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold px-1">Pinned Artists</p>
            <div className="space-y-4 px-1 max-h-64 overflow-y-auto scrollbar-hide">
              {selectedArtists.map((artistName) => {
                const artistData = POPULAR_ARTISTS.find(a => a.name === artistName);
                return (
                  <div 
                    key={artistName}
                    onClick={() => {
                      setShowSearch(true);
                      setShowArtists(false);
                      setSelectedPlaylistId(null);
                      setShowFavorites(false);
                      setViewingSong(null);
                      setShowDownloaded(false);
                      setShowAiGenerator(false);
                      setAiPrompt(`Greatest hits by ${artistName}`);
                      setSelectedGenre('');
                      setSelectedYear('');
                    }}
                    className="flex items-center gap-3 group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white/5 group-hover:border-[#FF0000]/50 transition-colors">
                      <img 
                        src={artistData?.image || "https://images.unsplash.com/photo-1511367461989-f85a21fda167?q=80&w=30&h=30&auto=format&fit=crop"} 
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                        alt={artistName}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/50 group-hover:text-white transition-colors truncate font-bold">{artistName}</p>
                      <p className="text-[8px] uppercase tracking-widest text-white/20 group-hover:text-[#FF0000]/50 transition-colors truncate font-black">
                        {artistData?.roles[0] || 'Artist'}
                      </p>
                    </div>
                  </div>
                );
              })}
              {selectedArtists.length === 0 && (
                <p className="text-[10px] text-white/20 italic tracking-wider">No pinned artists</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold px-1">Settings</p>
            <div className="px-1 py-1 flex items-center justify-between group">
              <span className="text-xs text-white/50">Storage Used</span>
              <span className="text-[10px] font-black text-[#FF0000] uppercase tracking-widest">{downloadedSongs.size * 12} MB</span>
            </div>
          </div>
        </nav>

        {!isPremium ? (
          <div className="mt-auto p-4 bg-gradient-to-br from-[#FF0000]/20 to-transparent rounded-xl border border-white/10">
            <p className="text-[10px] font-bold text-[#FF0000] uppercase tracking-wider mb-1">Free Version</p>
            <p className="text-xs text-white/70 leading-relaxed">AI Powered Recommendations</p>
            <button 
              onClick={() => setIsPremium(true)}
              className="mt-3 w-full bg-white text-black text-[10px] font-bold py-2 rounded-full uppercase tracking-widest hover:scale-[1.02] transition-transform"
            >Upgrade</button>
          </div>
        ) : (
          <div className="mt-auto p-4 bg-gradient-to-br from-[#FF0000]/10 to-[#FF0000]/5 rounded-xl border border-[#FF0000]/30 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[#FF0000]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-3 h-3 text-[#FF0000]" />
                    <p className="text-[10px] font-black text-[#FF0000] uppercase tracking-widest">Premium Member</p>
                </div>
                <p className="text-[10px] text-white/60 font-bold leading-tight">AuraX Pro Enabled • High Fidelity Audio • Zero Interruption</p>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {!isOnline && (
            <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="bg-red-500/10 border-b border-red-500/20 px-8 py-2 flex items-center justify-between z-50"
            >
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-500">Offline Mode • Playing from downloads only</p>
                </div>
                <p className="text-[10px] text-red-500/60 font-bold uppercase tracking-widest">Connect to internet for full access</p>
            </motion.div>
        )}
        <header className="h-16 flex items-center justify-between px-8 z-40 bg-transparent">
          <div className="flex gap-4">
            <button 
                onClick={() => {
                    if (history.length > 1) {
                        const prev = history[1];
                        setCurrentSong(prev);
                        setIsPlaying(true);
                    }
                }}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                title="Back to Previous Song"
            >‹</button>
            <button 
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors opacity-30 cursor-not-allowed"
                title="Forward (Coming Soon)"
            >›</button>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-white transition-colors">{user.displayName || user.email}</p>
              <p className={cn(
                "text-[10px] uppercase tracking-tighter transition-colors",
                isPremium ? "text-[#FF0000] font-black" : "text-white/40"
              )}>
                {isPremium ? "PREMIUM ACCOUNT" : "Free Account"}
              </p>
            </div>
            <div className="flex items-center gap-2">
                <div className={cn(
                  "w-10 h-10 rounded-full border p-0.5 transition-all overflow-hidden",
                  isPremium ? "border-[#FF0000] shadow-[0_0_15px_rgba(255,0,0,0.3)] scale-110" : "border-white/20"
                )}>
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#FF0000] to-indigo-600 flex items-center justify-center overflow-hidden">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#121212] flex items-center justify-center backdrop-blur-sm">
                        <User className={cn("w-5 h-5", isPremium ? "text-[#FF0000]" : "text-white/20")} />
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={handleSignOut}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/40 hover:text-white"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-8 pb-32 scroll-smooth bg-gradient-to-b from-zinc-900/50 to-[#050505]">
          <AnimatePresence mode="wait">
            {showAuraX && (
                <motion.div 
                    key="aura-panel"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="pt-12 h-content flex flex-col"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF0000] to-red-900 flex items-center justify-center shadow-lg shadow-[#FF0000]/20">
                            <Sparkles className="w-8 h-8 text-white fill-current" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white">AuraX AI</h1>
                                {isPremium && (
                                    <span className="px-2 py-0.5 bg-white/10 text-[#FF0000] text-[8px] font-black rounded-sm border border-[#FF0000]/30 tracking-widest">PRO</span>
                                )}
                            </div>
                            <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
                                {isPremium ? "Enhanced Neural Co-pilot" : "Your Musical Co-pilot"}
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 min-h-[400px] flex flex-col bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {auraXMessages.length === 0 && (
                              <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-20">
                                  <Sparkles className="w-12 h-12 mb-4" />
                                  <p className="text-lg font-bold italic">AuraX is ready to assist</p>
                                  <p className="text-xs">Ask about music history, theory, or current tracks</p>
                              </div>
                            )}
                            {auraXMessages.map((msg, idx) => (
                                <motion.div 
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "max-w-[80%] p-4 rounded-2xl",
                                        msg.role === 'auraX' 
                                            ? "bg-white/10 rounded-tl-none mr-auto text-white/90" 
                                            : "bg-[#FF0000] rounded-tr-none ml-auto text-black font-bold"
                                    )}
                                >
                                    <p className="text-sm leading-relaxed">{msg.text}</p>
                                </motion.div>
                            ))}
                            {isAuraXLoading && (
                                <div className="flex items-center gap-2 text-white/30 text-xs font-bold uppercase tracking-widest p-2">
                                    <div className="flex gap-1">
                                      <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-1 rounded-full bg-white" />
                                      <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 rounded-full bg-white" />
                                      <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 rounded-full bg-white" />
                                    </div>
                                    <span>AuraX is thinking...</span>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleAuraXSend} className="p-4 bg-black/40 border-t border-white/10 flex gap-4">
                            <input 
                                value={auraXInput}
                                onChange={(e) => setAuraXInput(e.target.value)}
                                placeholder={currentSong ? `Ask about "${currentSong.title}"...` : "Ask anything about music..."}
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#FF0000] transition-all placeholder:text-white/20"
                            />
                            <button 
                                type="submit"
                                disabled={isAuraXLoading}
                                className="bg-[#FF0000] hover:bg-[#ff1a1a] disabled:opacity-50 disabled:hover:bg-[#FF0000] text-black px-6 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shrink-0"
                            >
                                Send
                            </button>
                        </form>
                    </div>

                    {currentSong && (
                        <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-3xl">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-2 rounded-lg bg-[#FF0000]/20 text-[#FF0000]">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-widest">Quick Actions</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    `Tell me about "${currentSong.title}"`,
                                    `Why does "${currentSong.artist}" sound like this?`,
                                    `Show me lyrics for this song`,
                                    `Recommend songs like this`
                                ].map((q, i) => (
                                    <button 
                                        key={i}
                                        onClick={async () => {
                                            setAuraXInput(q);
                                            setIsAuraXLoading(true);
                                            // Trigger send automatically
                                            const response = await getAuraXChat(q, auraXMessages, currentSong, history, selectedArtists);
                                            setAuraXMessages(prev => [...prev, { role: 'user', text: q }, { role: 'auraX', text: response }]);
                                            setIsAuraXLoading(false);
                                            setAuraXInput("");
                                        }}
                                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all text-left"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            )}

            {viewingSong && (
                <motion.div
                    key="song-detail"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="pt-12"
                >
                    <button 
                        onClick={() => setViewingSong(null)}
                        className="flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-8 group"
                    >
                        <X className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-widest">Back to library</span>
                    </button>

                    <div className="flex flex-col lg:flex-row gap-12">
                        {/* Artwork */}
                        <div className="w-full lg:w-[400px] shrink-0">
                            <motion.div 
                                layoutId={`cover-${viewingSong.id}`}
                                className="aspect-square rounded-3xl overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-white/10"
                            >
                                <img 
                                    src={viewingSong.coverUrl} 
                                    className="w-full h-full object-cover" 
                                    referrerPolicy="no-referrer"
                                />
                            </motion.div>
                            {currentSong?.id === viewingSong.id && (
                                <div className="mt-8 flex justify-center">
                                    <Visualizer isPlaying={isPlaying} />
                                </div>
                            )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 flex flex-col justify-end pb-4">
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[#FF0000] text-xs font-black uppercase tracking-[0.3em] mb-4">Now Inspecting</p>
                                    <h1 className="text-6xl lg:text-8xl font-black italic tracking-tighter text-white uppercase leading-none mb-6">
                                        {viewingSong.title}
                                    </h1>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                            <User className="w-6 h-6 text-white/40" />
                                        </div>
                                        <div>
                                            <p className="text-white font-black text-xl italic">{viewingSong.artist}</p>
                                            <p className="text-white/40 text-xs font-bold uppercase tracking-widest">{viewingSong.album}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-12 border-t border-white/5">
                                    <div>
                                        <p className="text-white/20 text-[10px] font-black uppercase tracking-widest mb-1">Release Date</p>
                                        <p className="text-white font-bold">{viewingSong.releaseDate || 'Unknown'}</p>
                                    </div>
                                    <div>
                                        <p className="text-white/20 text-[10px] font-black uppercase tracking-widest mb-1">Genre</p>
                                        <p className="text-white font-bold">{viewingSong.genre || 'Electronic'}</p>
                                    </div>
                                    <div>
                                        <p className="text-white/20 text-[10px] font-black uppercase tracking-widest mb-1">Duration</p>
                                        <p className="text-white font-bold">{formatTime(viewingSong.duration)}</p>
                                    </div>
                                    <div>
                                        <p className="text-white/20 text-[10px] font-black uppercase tracking-widest mb-1">Availability</p>
                                        <p className={cn(
                                          "font-bold",
                                          downloadedSongs.has(viewingSong.id) ? "text-[#FF0000]" : "text-white/40"
                                        )}>
                                          {downloadedSongs.has(viewingSong.id) ? "Available Offline" : "Online Only"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-4 pt-8">
                                    <button 
                                        onClick={() => {
                                            setCurrentSong(viewingSong);
                                            setIsPlaying(true);
                                        }}
                                        disabled={!isOnline && !downloadedSongs.has(viewingSong.id)}
                                        className={cn(
                                          "bg-[#FF0000] text-black px-12 py-5 rounded-full font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#FF0000]/20 flex items-center gap-3",
                                          (!isOnline && !downloadedSongs.has(viewingSong.id)) && "opacity-30 grayscale cursor-not-allowed"
                                        )}
                                    >
                                        <Play className="w-5 h-5 fill-current" />
                                        Play Now
                                    </button>
                                    
                                    <button 
                                        onClick={() => handleDownload(viewingSong)}
                                        disabled={downloadedSongs.has(viewingSong.id) || downloadingSongs[viewingSong.id] !== undefined}
                                        className={cn(
                                            "w-16 h-16 rounded-full border border-white/10 flex items-center justify-center transition-all hover:bg-white/5 relative group",
                                            downloadedSongs.has(viewingSong.id) ? "text-[#FF0000] border-[#FF0000]/20" : "text-white/40"
                                        )}
                                    >
                                        {downloadingSongs[viewingSong.id] !== undefined ? (
                                            <div className="relative w-8 h-8">
                                                <svg className="w-8 h-8 -rotate-90">
                                                    <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-20" />
                                                    <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray={88} strokeDashoffset={88 - (88 * downloadingSongs[viewingSong.id]) / 100} />
                                                </svg>
                                                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black">{downloadingSongs[viewingSong.id]}%</span>
                                            </div>
                                        ) : downloadedSongs.has(viewingSong.id) ? (
                                            <CheckCircle2 className="w-6 h-6" />
                                        ) : (
                                            <Download className="w-6 h-6 group-hover:translate-y-0.5 transition-transform" />
                                        )}
                                    </button>

                                    <button 
                                        onClick={() => toggleFavorite(viewingSong.id)}
                                        className={cn(
                                            "w-16 h-16 rounded-full border border-white/10 flex items-center justify-center transition-all hover:bg-white/5",
                                            favorites.has(viewingSong.id) ? "text-[#FF0000] bg-[#FF0000]/5 border-[#FF0000]/20" : "text-white/40"
                                        )}
                                    >
                                        <Heart className={cn("w-6 h-6", favorites.has(viewingSong.id) && "fill-current")} />
                                    </button>
                                    
                                    <button 
                                        onClick={fetchViewingLyrics}
                                        className={cn(
                                            "flex items-center gap-2 px-6 h-16 rounded-full border border-white/10 transition-all hover:bg-white/5",
                                            showViewingLyrics ? "text-[#FF0000] border-[#FF0000]/20 bg-[#FF0000]/5" : "text-white/40"
                                        )}
                                    >
                                        <Languages className="w-5 h-5" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Lyrics</span>
                                    </button>
                                </div>

                                {showViewingLyrics && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mt-12 p-8 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm"
                                    >
                                        <div className="flex justify-between items-center mb-8">
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FF0000]">Lyrics</p>
                                            <button onClick={() => setShowViewingLyrics(false)} className="text-white/20 hover:text-white transition-colors">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="whitespace-pre-wrap text-xl md:text-2xl font-black leading-tight tracking-tight text-white/90 max-h-[400px] overflow-y-auto pr-4 scrollbar-hide">
                                            {isLoadingViewingLyrics ? (
                                                <div className="flex flex-col gap-4">
                                                    <div className="h-8 bg-white/5 rounded-lg w-full animate-pulse" />
                                                    <div className="h-8 bg-white/5 rounded-lg w-3/4 animate-pulse" />
                                                    <div className="h-8 bg-white/5 rounded-lg w-1/2 animate-pulse" />
                                                </div>
                                            ) : (
                                                viewingSongLyrics || "Lyrics unavailable"
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {showAiGenerator && !showAuraX && !viewingSong && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="pt-12"
                >
                  <div className="flex items-end gap-6 mb-12">
                    <div className="w-52 h-52 bg-gradient-to-br from-[#FF0000] to-black shadow-2xl flex items-center justify-center rounded-2xl overflow-hidden relative group">
                      <Wand2 className="w-20 h-20 text-black z-10 transition-transform group-hover:scale-110" />
                      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&h=600&fit=crop')] opacity-20 mix-blend-overlay" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-black uppercase tracking-widest text-[#FF0000] mb-2">Experimental Feature</p>
                      <h1 className="text-7xl font-black italic tracking-tighter text-white leading-none mb-4 uppercase">Playlist Lab</h1>
                      <div className="flex items-center gap-4 text-sm text-white/50 font-bold uppercase tracking-widest">
                        <span>AI-Powered Mix Generation</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-3xl p-8 border border-white/10 backdrop-blur-xl mb-12">
                    <form onSubmit={handleAiSearch} className="space-y-8">
                      <div className="space-y-4">
                        <label className="text-xs font-black uppercase tracking-widest text-[#FF0000]">What's the vibe?</label>
                        <textarea 
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          placeholder="Describe a mood, activity, or setting... (e.g. 'Midnight drive through a rainy neon city', 'Intense focus for high-stakes gaming', 'Sunday morning coffee on a balcony')"
                          className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-[#FF0000]/50 transition-all placeholder:text-white/10 italic min-h-[120px] resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <label className="text-xs font-black uppercase tracking-widest text-white/30 ml-2">Genre Filtering</label>
                          <select 
                            value={selectedGenre}
                            onChange={(e) => setSelectedGenre(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-sm font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-[#FF0000]/50 transition-all cursor-pointer appearance-none text-zinc-300"
                          >
                            <option value="" className="bg-zinc-900">All Genres</option>
                            {["Pop", "Hip-Hop", "Rock", "Jazz", "Electronic", "Synthwave", "Ambient", "Industrial", "Deep House", "Chillout"].map(g => (
                              <option key={g} value={g} className="bg-zinc-900">{g}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-4">
                          <label className="text-xs font-black uppercase tracking-widest text-white/30 ml-2">Release Era</label>
                          <select 
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-sm font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-[#FF0000]/50 transition-all cursor-pointer appearance-none text-zinc-300"
                          >
                            <option value="" className="bg-zinc-900">Any Era</option>
                            {["2024", "2023", "2022", "2021", "2020", "2010s", "2000s", "90s", "80s"].map(y => (
                              <option key={y} value={y} className="bg-zinc-900">{y}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button 
                          type="submit"
                          disabled={isLoadingRecs || !aiPrompt.trim()}
                          className="flex-1 bg-[#FF0000] text-black h-16 rounded-full font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-3"
                        >
                          {isLoadingRecs ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                              <Sparkles className="w-5 h-5" />
                              Generate Sonic Blueprint
                            </>
                          )}
                        </button>
                        {(aiPrompt || selectedGenre || selectedYear) && (
                          <button 
                            type="button"
                            onClick={() => { setAiPrompt(""); setSelectedGenre(""); setSelectedYear(""); setAiRecs([]); }}
                            className="px-8 h-16 rounded-full border border-white/10 text-white/40 font-black text-sm uppercase tracking-widest hover:bg-white/5 transition-all"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  {aiRecs.length > 0 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h2 className="text-2xl font-black italic tracking-tighter uppercase">Generated Results</h2>
                          <span className="px-3 py-1 bg-[#FF0000]/10 text-[#FF0000] text-[8px] font-black uppercase tracking-widest rounded-full border border-[#FF0000]/20 animate-pulse">Analysis Complete</span>
                        </div>
                        <button 
                          onClick={saveAiRecsAsPlaylist}
                          className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all"
                        >
                          <PlusSquare className="w-4 h-4" />
                          Save as Playlist
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {aiRecs.map((song) => (
                          <SongCard 
                            key={`ai-gen-${song.id}`}
                            song={song}
                            isActive={currentSong?.id === song.id}
                            isDownloaded={downloadedSongs.has(song.id)}
                            isLiked={favorites.has(song.id)}
                            onToggleLike={() => toggleFavorite(song.id)}
                            isInLyricsQueue={lyricsQueue.has(song.id)}
                            onToggleLyricsQueue={() => toggleLyricsQueue(song.id)}
                            playlists={playlists}
                            onAddToPlaylist={(pid) => addToPlaylist(pid, song.id)}
                            onPlay={() => {
                              setCurrentQueue(aiRecs);
                              setCurrentSong(song);
                              setIsPlaying(true);
                            }}
                            onViewDetail={() => setViewingSong(song)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
            )}

            {showLyricsQueue && !showAuraX && !viewingSong && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="pt-12"
                >
                  <div className="flex items-end gap-6 mb-12">
                    <div className="w-52 h-52 bg-gradient-to-br from-indigo-600 to-purple-900 shadow-2xl flex items-center justify-center rounded-2xl overflow-hidden relative">
                      <ListMusic className="w-20 h-20 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-black uppercase tracking-widest text-[#FF0000] mb-2">Focused Study</p>
                      <h1 className="text-7xl font-black italic tracking-tighter text-white leading-none mb-4 uppercase">Lyrics Queue</h1>
                      <div className="flex items-center gap-2 text-sm text-white/50 font-bold uppercase tracking-widest">
                        <span className="text-white">Temporary Collection</span> • {Array.from(lyricsQueue).length} tracks
                      </div>
                    </div>
                  </div>
 
                  {allSongs.filter(s => lyricsQueue.has(s.id)).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                      {allSongs
                        .filter(s => lyricsQueue.has(s.id))
                        .map((song) => (
                        <SongCard 
                          key={`lq-view-${song.id}`}
                          song={song}
                          isActive={currentSong?.id === song.id}
                          isDownloaded={downloadedSongs.has(song.id)}
                          isLiked={favorites.has(song.id)}
                          onToggleLike={() => toggleFavorite(song.id)}
                          isInLyricsQueue={true}
                          onToggleLyricsQueue={() => toggleLyricsQueue(song.id)}
                          playlists={playlists}
                          onAddToPlaylist={(pid) => addToPlaylist(pid, song.id)}
                          onPlay={() => {
                            setCurrentQueue(allSongs.filter(s => lyricsQueue.has(s.id)));
                            setCurrentSong(song);
                            setIsPlaying(true);
                          }}
                          onViewDetail={() => setViewingSong(song)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                      <p className="text-white/20 font-black italic tracking-tighter text-2xl mb-4">Lyrics queue is empty</p>
                      <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-8">Add songs here to quickly access their lyrics later</p>
                      <button 
                        onClick={() => setShowSearch(true)}
                        className="bg-white text-black px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform"
                      >
                        Explore Music
                      </button>
                    </div>
                  )}
                </motion.div>
             )}

            {showDownloaded && !showAuraX && !viewingSong && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="pt-12"
                >
                  <div className="flex items-end gap-6 mb-12">
                    <div className="w-52 h-52 bg-gradient-to-br from-red-600 to-red-900 shadow-2xl flex items-center justify-center rounded-2xl overflow-hidden relative">
                      <Download className="w-20 h-20 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-2">Library</p>
                      <h1 className="text-7xl font-black italic tracking-tighter text-white leading-none mb-4 uppercase">Downloaded</h1>
                      <div className="flex items-center gap-2 text-sm text-white/50 font-bold uppercase tracking-widest">
                        <span className="text-white">{isOnline ? "Cloud Sync Active" : "Offline Mode Enabled"}</span> • {Object.keys(offlineMetadata).length} tracks
                      </div>
                    </div>
                  </div>
 
                  {allSongs.filter(s => downloadedSongs.has(s.id)).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                      {allSongs
                        .filter(s => downloadedSongs.has(s.id))
                        .map((song) => (
                        <SongCard 
                          key={`dl-view-${song.id}`}
                          song={song}
                          isActive={currentSong?.id === song.id}
                          isDownloaded={true}
                          isLiked={favorites.has(song.id)}
                          onToggleLike={() => toggleFavorite(song.id)}
                          isInLyricsQueue={lyricsQueue.has(song.id)}
                          onToggleLyricsQueue={() => toggleLyricsQueue(song.id)}
                          playlists={playlists}
                          onAddToPlaylist={(pid) => addToPlaylist(pid, song.id)}
                          onPlay={() => {
                            setCurrentQueue(allSongs.filter(s => downloadedSongs.has(s.id)));
                            setCurrentSong(song);
                            setIsPlaying(true);
                          }}
                          onViewDetail={() => setViewingSong(song)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                      <p className="text-white/20 font-black italic tracking-tighter text-2xl mb-4">No offline tracks yet</p>
                      <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-8">Download songs to listen without an internet connection</p>
                      <button 
                        onClick={() => setShowSearch(true)}
                        className="bg-white text-black px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform"
                      >
                        Find Music
                      </button>
                    </div>
                  )}
                </motion.div>
             )}

            {showArtists && !showAuraX && !viewingSong && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="pt-12"
                >
                  <div className="flex items-end gap-6 mb-12">
                    <div className="w-52 h-52 bg-gradient-to-br from-white/10 to-transparent shadow-2xl flex items-center justify-center rounded-full overflow-hidden relative border border-white/10 p-8 group">
                       <User className="w-full h-full text-white/20 group-hover:text-[#FF0000]/40 transition-colors" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-2">Library</p>
                      <h1 className="text-7xl font-black italic tracking-tighter text-white leading-none mb-4 uppercase">Your Artists</h1>
                      <div className="flex items-center gap-2 text-sm text-white/50 font-bold uppercase tracking-widest">
                        Following <span className="text-white">{selectedArtists.length}</span> creators
                      </div>
                    </div>
                  </div>

                  {selectedArtists.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                      {selectedArtists.map((artistName) => {
                        const artistData = POPULAR_ARTISTS.find(a => a.name === artistName);
                        return (
                          <motion.div
                            key={`art-view-${artistName}`}
                            whileHover={{ y: -8, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setShowSearch(true);
                              setShowArtists(false);
                              setAiPrompt(`Best hits by ${artistName}`);
                              setSelectedGenre('');
                              setSelectedYear('');
                            }}
                            className="bg-white/5 border border-white/5 p-4 rounded-3xl flex flex-col items-center gap-4 cursor-pointer hover:bg-white/10 transition-all shadow-lg group relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-b from-[#FF0000]/0 to-[#FF0000]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="w-full aspect-square rounded-2xl bg-white/5 overflow-hidden shadow-2xl relative">
                               <img 
                                 src={artistData?.image || "https://images.unsplash.com/photo-1511367461989-f85a21fda167?q=80&w=200&h=200&auto=format&fit=crop"} 
                                 className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                 alt={artistName}
                               />
                               <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-center p-4">
                                  <div className="bg-[#FF0000] w-10 h-10 rounded-full flex items-center justify-center text-black shadow-xl translate-y-10 group-hover:translate-y-0 transition-transform duration-300">
                                     <Play className="w-5 h-5 fill-current" />
                                  </div>
                               </div>
                            </div>
                            <div className="text-center w-full">
                               <span className="text-sm font-bold text-white block truncate mb-1 group-hover:text-[#FF0000] transition-colors">{artistName}</span>
                               <span className="text-[10px] font-black uppercase tracking-widest text-white/30 truncate block">
                                  {artistData?.roles[0] || 'Artist'}
                               </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                      <p className="text-white/20 font-black italic tracking-tighter text-2xl mb-4">You haven't followed any artists yet</p>
                      <button 
                        onClick={() => setOnboardingComplete(false)}
                        className="bg-white text-black px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform"
                      >
                        Discover Artists
                      </button>
                    </div>
                  )}
                </motion.div>
            )}

            {showReferral && !showAuraX && !viewingSong && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pt-12 max-w-2xl"
                >
                  <div className="flex items-center gap-6 mb-12">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#FF0000] to-[#ff3333] flex items-center justify-center shadow-xl shadow-[#FF0000]/20">
                      <Gift className="w-10 h-10 text-black" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none mb-2">
                        Refer a Friend
                      </h1>
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest text-[#FF0000]">Share the music, earn rewards</p>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl mb-8">
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-white font-black italic uppercase tracking-tight text-xl mb-2">Your Referral Code</h3>
                        <p className="text-zinc-400 text-sm mb-6 leading-relaxed">Share this code with your friends and they'll get a special badge when they join AuraX.</p>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-8 py-5 text-2xl font-black tracking-[0.5em] text-[#FF0000] flex items-center justify-center">
                            {referralCode}
                          </div>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(referralCode || "");
                              // Could add a toast here
                            }}
                            className="bg-white/5 hover:bg-white/10 border border-white/10 p-5 rounded-2xl transition-all active:scale-95"
                          >
                            <Share2 className="w-6 h-6 text-white" />
                          </button>
                        </div>
                      </div>

                      <div className="h-px bg-white/5" />

                      <div>
                        <h3 className="text-white font-black italic uppercase tracking-tight text-xl mb-2">Quick Share Link</h3>
                        <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                          <input 
                            readOnly 
                            value={`https://melodify.ai/join?ref=${referralCode}`}
                            className="flex-1 bg-transparent border-none text-zinc-500 text-sm font-mono focus:outline-none"
                          />
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(`https://melodify.ai/join?ref=${referralCode}`);
                            }}
                            className="text-[#FF0000] text-xs font-black uppercase tracking-widest hover:underline"
                          >
                            Copy Link
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                      <div className="text-[#FF0000] font-black text-3xl mb-1 italic">0</div>
                      <div className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Friends Referred</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                      <div className="text-[#FF0000] font-black text-3xl mb-1 italic">N/A</div>
                      <div className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Active Rewards</div>
                    </div>
                  </div>
                </motion.div>
            )}

            {showProfile && !showAuraX && !viewingSong && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pt-12 max-w-2xl"
                >
                  <div className="flex items-center gap-6 mb-12">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-[#FF0000]/30 shadow-2xl shadow-[#FF0000]/10">
                        {editPhoto ? (
                          <img src={editPhoto} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-3xl font-black text-white/20">
                            {editName?.charAt(0) || user?.displayName?.charAt(0) || 'U'}
                          </div>
                        )}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none mb-2">
                        {user?.displayName || 'Your Profile'}
                      </h1>
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Manage your personal information</p>
                    </div>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-6 bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-xl">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#FF0000] ml-1">Display Name</label>
                      <input 
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-6 py-4 text-white focus:outline-none focus:ring-1 focus:ring-[#FF0000] transition-all"
                        placeholder="Your name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#FF0000] ml-1">Email Address</label>
                      <input 
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-6 py-4 text-white focus:outline-none focus:ring-1 focus:ring-[#FF0000] transition-all"
                        placeholder="your@email.com"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#FF0000] ml-1">Profile Picture URL</label>
                      <input 
                        type="url"
                        value={editPhoto}
                        onChange={(e) => setEditPhoto(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-6 py-4 text-white focus:outline-none focus:ring-1 focus:ring-[#FF0000] transition-all"
                        placeholder="https://example.com/photo.jpg"
                      />
                    </div>

                    <div className="pt-4 flex items-center gap-4">
                      <button 
                        type="submit"
                        disabled={isUpdatingProfile}
                        className="bg-[#FF0000] hover:bg-[#ff3333] text-black px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 disabled:opacity-50"
                      >
                        {isUpdatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                      </button>
                      
                      {profileUpdateSuccess && (
                        <motion.span 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-[#FF0000] text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Updated Successfully
                        </motion.span>
                      )}
                    </div>

                    {authError && (
                      <p className="text-red-500 text-xs mt-4 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                        {authError}
                      </p>
                    )}
                  </form>

                  <div className="pt-8 mt-12 border-t border-white/5 space-y-6">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-white font-black italic uppercase tracking-tight text-xl">Account Session</h3>
                      <p className="text-zinc-500 text-sm">Click below to sign out and return to the entry screen to test different login methods.</p>
                    </div>
                    <button 
                      onClick={handleSignOut}
                      className="w-full flex items-center justify-center gap-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.01] active:scale-[0.98]"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out Now
                    </button>
                    <p className="text-zinc-600 text-[10px] text-center font-bold uppercase tracking-widest">
                      Your preferences and playlists are synced to your account.
                    </p>
                  </div>
                </motion.div>
            )}

            {showFavorites && !showAuraX && !viewingSong && (
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="pt-12"
               >
                 <div className="flex items-end gap-6 mb-12">
                   <div className="w-52 h-52 bg-gradient-to-br from-indigo-600 to-indigo-900 shadow-2xl flex items-center justify-center rounded-2xl overflow-hidden relative">
                     <Heart className="w-20 h-20 text-white fill-current" />
                   </div>
                   <div className="flex-1">
                     <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-2">Playlist</p>
                     <h1 className="text-7xl font-black italic tracking-tighter text-white leading-none mb-4 uppercase">Liked Songs</h1>
                     <div className="flex items-center gap-2 text-sm text-white/50 font-bold uppercase tracking-widest">
                       <span className="text-white">Guest</span> • {favoriteSongs.length} songs
                     </div>
                   </div>
                 </div>

                 {favoriteSongs.length > 0 ? (
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                     {favoriteSongs.map((song) => (
                       <SongCard 
                         key={`fav-view-${song.id}`}
                         song={song}
                         isActive={currentSong?.id === song.id}
                         isOffline={downloadedSongs.has(song.id)}
                         isDownloaded={downloadedSongs.has(song.id)}
                         downloadProgress={downloadingSongs[song.id]}
                         onDownload={() => handleDownload(song)}
                         isLiked={favorites.has(song.id)}
                         onToggleLike={() => toggleFavorite(song.id)}
                         isInLyricsQueue={lyricsQueue.has(song.id)}
                         onToggleLyricsQueue={() => toggleLyricsQueue(song.id)}
                         playlists={playlists}
                         onAddToPlaylist={(pid) => addToPlaylist(pid, song.id)}
                         onPlay={() => {
                           setCurrentSong(song);
                           setIsPlaying(true);
                         }}
                         onViewDetail={() => setViewingSong(song)}
                       />
                     ))}
                   </div>
                 ) : (
                   <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                     <p className="text-white/20 font-black italic tracking-tighter text-2xl mb-4">You haven't liked any songs yet</p>
                     <button 
                       onClick={() => setShowSearch(true)}
                       className="bg-white text-black px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform"
                     >
                       Go Discover
                     </button>
                   </div>
                 )}
               </motion.div>
            )}

            {selectedPlaylist && !showFavorites && !showAuraX && !viewingSong && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key={`playlist-${selectedPlaylist.id}`}
                className="pt-12"
              >
                <div className="flex items-end gap-6 mb-12">
                  <div className="w-52 h-52 bg-gradient-to-br from-zinc-700 to-black shadow-2xl flex items-center justify-center rounded-2xl overflow-hidden relative group">
                    <ListMusic className="w-20 h-20 text-white/10" />
                    {playlistSongs.length > 0 && (
                      <img src={playlistSongs[0].coverUrl} className="absolute inset-0 w-full h-full object-cover opacity-60" referrerPolicy="no-referrer" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-2">Playlist</p>
                    <input 
                      type="text"
                      value={selectedPlaylist.name}
                      onChange={(e) => renamePlaylist(selectedPlaylist.id, e.target.value)}
                      className="text-7xl font-black italic tracking-tighter bg-transparent border-none focus:outline-none focus:ring-0 w-full text-white leading-none mb-4 -ml-1"
                    />
                    <div className="flex items-center gap-6 mt-6">
                      <button 
                        onClick={() => {
                            const songs = playlistSongs.length > 0 ? playlistSongs : [];
                            if (songs.length > 0) {
                                const playSongs = isShuffleOn ? [...songs].sort(() => Math.random() - 0.5) : songs;
                                setCurrentSong(playSongs[0]);
                                setIsPlaying(true);
                            }
                        }}
                        className="bg-[#FF0000] text-black px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-transform shadow-xl"
                      >
                        <Play className="w-4 h-4 fill-current" /> PLAY
                      </button>
                      <button 
                         onClick={toggleShuffle}
                         className={cn(
                             "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all",
                             isShuffleOn ? "border-[#FF0000] text-[#FF0000] bg-[#FF0000]/10" : "border-white/20 text-white/40 hover:border-white/40"
                         )}
                      >
                        <Shuffle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <button 
                    onClick={() => deletePlaylist(selectedPlaylist.id)}
                    className="p-3 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500/20 transition-colors"
                    title="Delete Playlist"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {playlistSongs.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {playlistSongs.map((song) => (
                      <SongCard 
                        key={`pls-${song.id}`}
                        song={song}
                        isActive={currentSong?.id === song.id}
                        isOffline={downloadedSongs.has(song.id)}
                        isDownloaded={downloadedSongs.has(song.id)}
                        downloadProgress={downloadingSongs[song.id]}
                        onDownload={() => handleDownload(song)}
                        isLiked={favorites.has(song.id)}
                        onToggleLike={() => toggleFavorite(song.id)}
                        isInLyricsQueue={lyricsQueue.has(song.id)}
                        onToggleLyricsQueue={() => toggleLyricsQueue(song.id)}
                        playlists={playlists}
                        onAddToPlaylist={(pid) => addToPlaylist(pid, song.id)}
                        onRemoveFromPlaylist={() => removeFromPlaylist(selectedPlaylist.id, song.id)}
                        isInPlaylist={true}
                        onPlay={() => {
                          setCurrentQueue(playlistSongs);
                          setCurrentSong(song);
                          setIsPlaying(true);
                        }}
                        onViewDetail={() => setViewingSong(song)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                    <p className="text-white/20 font-black italic tracking-tighter text-2xl mb-4">This playlist is lonely</p>
                    <button 
                      onClick={() => setShowSearch(true)}
                      className="bg-white text-black px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform"
                    >
                      Find songs to add
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {!selectedPlaylist && showLyrics && !showAuraX && !viewingSong && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="fixed inset-0 top-16 bottom-24 left-60 right-0 bg-gradient-to-b from-indigo-900/90 to-black/95 z-30 overflow-y-auto p-12 backdrop-blur-sm"
                >
                    <div className="max-w-3xl mx-auto">
                        <div className="flex justify-between items-start mb-12">
                            <div>
                                <h1 className="text-6xl font-black italic tracking-tighter mb-4 text-white uppercase">{currentSong?.title}</h1>
                                <p className="text-xl font-bold text-[#FF0000] uppercase tracking-widest">{currentSong?.artist}</p>
                            </div>
                            <button 
                                onClick={() => setShowLyrics(false)}
                                className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="whitespace-pre-wrap text-3xl font-black leading-tight tracking-tight text-white/90">
                            {isLoadingLyrics ? (
                                <div className="flex flex-col gap-4">
                                    <div className="h-10 bg-white/10 rounded-lg w-full animate-pulse" />
                                    <div className="h-10 bg-white/10 rounded-lg w-3/4 animate-pulse" />
                                    <div className="h-10 bg-white/10 rounded-lg w-1/2 animate-pulse" />
                                    <div className="h-10 bg-white/10 rounded-lg w-4/5 animate-pulse" />
                                </div>
                            ) : (
                                lyrics || "Humming along..."
                            )}
                        </div>
                        
                        <p className="mt-20 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Lyrics provided by AI Studio</p>
                    </div>
                </motion.div>
            )}

            {showSearch && !selectedPlaylistId && !showFavorites && !showAuraX && !viewingSong && (
             <motion.section 
                key="search-panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-6"
             >
                <div className="flex items-center gap-2 mb-8">
                    <Sparkles className="w-5 h-5 text-[#FF0000]" />
                    <h2 className="text-2xl font-black italic tracking-tighter uppercase">AI Studio curation</h2>
                </div>
                
                <form onSubmit={handleAiSearch} className="mb-10">
                    <div className="relative group max-w-2xl shadow-2xl mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#FF0000]" />
                        <input 
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            type="text" 
                            placeholder="Describe your mood... (e.g. Synthwave for coding)" 
                            className="w-full bg-white/5 backdrop-blur-xl rounded-2xl pl-12 pr-4 py-4 text-xl font-bold focus:outline-none focus:ring-1 focus:ring-[#FF0000]/50 border border-white/10 transition-all placeholder:text-white/20 italic"
                        />
                        <button 
                            type="submit"
                            disabled={isLoadingRecs}
                            className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-2 bg-[#FF0000] rounded-full text-black text-xs font-black uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50"
                        >
                            {isLoadingRecs ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "GENERATE"}
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-4 px-1">
                        <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-2">Genre Context</label>
                            <select 
                                value={selectedGenre}
                                onChange={(e) => setSelectedGenre(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-1 focus:ring-[#FF0000]/50 transition-all cursor-pointer appearance-none min-w-[140px] text-zinc-300"
                            >
                                <option value="" className="bg-zinc-900">All Genres</option>
                                {["Pop", "Hip-Hop", "Rock", "Jazz", "Electronic", "Synthwave", "Ambient", "Industrial", "Deep House", "Chillout"].map(g => (
                                    <option key={g} value={g} className="bg-zinc-900">{g}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-white/30 ml-2">Preferred Era</label>
                            <select 
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-1 focus:ring-[#FF0000]/50 transition-all cursor-pointer appearance-none min-w-[140px] text-zinc-300"
                            >
                                <option value="" className="bg-zinc-900">Any Year</option>
                                {["2024", "2023", "2022", "2021", "2020", "2010s", "2000s", "90s", "80s"].map(y => (
                                    <option key={y} value={y} className="bg-zinc-900">{y}</option>
                                ))}
                            </select>
                        </div>

                        {(selectedGenre || selectedYear || aiPrompt) && !isLoadingRecs && (
                            <button 
                                type="button"
                                onClick={() => { setSelectedGenre(""); setSelectedYear(""); setAiPrompt(""); setAiRecs([]); }}
                                className="self-end mb-3 text-white/30 hover:text-[#FF0000] text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-1 group"
                            >
                                <X className="w-3 h-3 group-hover:rotate-90 transition-transform" />
                                Clear Filters
                            </button>
                        )}
                    </div>
                </form>

                {aiRecs.length > 0 && (
                    <div className="mb-12">
                        <div className="flex items-center justify-between mb-6 px-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Curated results</p>
                            <div className="flex items-center gap-2 px-3 py-1 bg-[#FF0000]/10 rounded-full border border-[#FF0000]/20">
                                <div className="w-1 h-1 bg-[#FF0000] rounded-full animate-ping" />
                                <span className="text-[8px] font-black uppercase tracking-widest text-[#FF0000]">Algorithmic Match: 98.4%</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {aiRecs.map((song) => (
                            <SongCard 
                                key={song.id} 
                                song={song as Song} 
                                isActive={currentSong?.id === song.id}
                                isOffline={downloadedSongs.has(song.id || '')}
                                isDownloaded={downloadedSongs.has(song.id || '')}
                                downloadProgress={downloadingSongs[song.id || '']}
                                onDownload={() => song.id && handleDownload(song)}
                                isLiked={favorites.has(song.id || '')}
                                onToggleLike={() => toggleFavorite(song.id || '')}
                                isInLyricsQueue={lyricsQueue.has(song.id || '')}
                                onToggleLyricsQueue={() => song.id && toggleLyricsQueue(song.id)}
                                playlists={playlists}
                                onAddToPlaylist={(pid) => addToPlaylist(pid, song.id!)}
                                onPlay={() => {
                                    setCurrentQueue(aiRecs as Song[]);
                                    setCurrentSong(song as Song);
                                    setIsPlaying(true);
                                }}
                                onViewDetail={() => setViewingSong(song as Song)}
                            />
                            ))}
                        </div>
                    </div>
                )}

                <h2 className="text-xs font-bold uppercase tracking-[0.2em] mb-6 text-white/30">Browse Categories</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {['Pop', 'Hip-Hop', 'Rock', 'Jazz', 'Electronic'].map((genre, i) => (
                        <div key={genre} 
                            onClick={() => {
                                setSelectedGenre(genre);
                                setAiPrompt(`Best of ${genre} music`);
                                handleAiSearch({ preventDefault: () => {} } as any);
                            }}
                            className={cn(
                                "aspect-square rounded-2xl p-6 relative overflow-hidden cursor-pointer group shadow-xl border border-white/5",
                                `bg-gradient-to-br from-${['rose-600', 'indigo-600', 'emerald-600', 'amber-600', 'sky-600'][i % 5]} to-black/40`
                            )}
                        >
                            <span className="text-2xl font-black italic tracking-tighter relative z-10 leading-none">{genre}</span>
                            <div className="absolute -bottom-4 -right-8 w-32 h-32 bg-white/10 rotate-12 transform group-hover:scale-110 transition-transform" />
                        </div>
                    ))}
                </div>
             </motion.section>
          )}

          {!showSearch && !selectedPlaylistId && !showFavorites && !showAuraX && !viewingSong && !showDownloaded && !showAiGenerator && !showLyricsQueue && (
            <motion.div
                key="home-panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <section className="relative h-[340px] rounded-3xl overflow-hidden mb-12 group mt-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FF0000] to-[#800000] opacity-90 transition-opacity group-hover:opacity-100"></div>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,#ffffff33,transparent_60%)]"></div>
                  <div className="relative h-full p-12 flex flex-col justify-end">
                    <p className="text-[11px] font-bold uppercase tracking-[0.4em] mb-4 text-white/80">Editor's Selection</p>
                    <h1 className="text-8xl font-black italic tracking-tighter leading-[0.85] mb-8 drop-shadow-2xl text-white">
                      THE SOUND<br/>OF NOW
                    </h1>
                    <div className="flex items-center gap-6">
                      <button 
                        onClick={() => {
                            setCurrentQueue(MOCK_SONGS);
                            setCurrentSong(MOCK_SONGS[0]);
                            setIsPlaying(true);
                        }}
                        className="bg-white text-black px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-transform"
                      >
                        PLAY NOW
                      </button>
                      <button 
                        onClick={() => toggleFollow('editors-selection')}
                        className={cn(
                            "text-xs font-black tracking-widest border-b-2 pb-1 cursor-pointer transition-colors uppercase",
                            followedPlaylists.has('editors-selection') ? "border-[#FF0000] text-[#FF0000]" : "border-white/40 text-white hover:border-white"
                        )}
                      >
                        {followedPlaylists.has('editors-selection') ? "FOLLOWED" : "FOLLOW PLAYLIST"}
                      </button>
                    </div>
                  </div>
                  <div className="absolute top-12 right-12 flex flex-col gap-2">
                    <div className="text-right text-[120px] font-black italic text-white/10 leading-none select-none tracking-tighter">01</div>
                  </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <section>
                        <div className="flex items-center justify-between mb-6 px-1">
                            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">English Top Hits</h2>
                            <button 
                                onClick={() => {
                                    setCurrentQueue(MOCK_SONGS.slice(0, 5));
                                    setCurrentSong(MOCK_SONGS[0]);
                                    setIsPlaying(true);
                                }}
                                className="text-[10px] font-black text-[#FF0000] uppercase tracking-widest hover:underline"
                            >
                                Play All
                            </button>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                            {MOCK_SONGS.slice(0, 6).map((song) => (
                                <div 
                                    key={`eng-${song.id}`}
                                    onClick={() => {
                                        setCurrentQueue(MOCK_SONGS.slice(0, 6));
                                        setCurrentSong(song);
                                        setIsPlaying(true);
                                    }}
                                    className="min-w-[160px] group cursor-pointer"
                                >
                    <div className="aspect-square rounded-xl overflow-hidden mb-3 relative">
                                        <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" referrerPolicy="no-referrer" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="w-10 h-10 bg-[#FF0000] rounded-full flex items-center justify-center shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                                <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                                            </div>
                                        </div>
                    </div>
                                    <p className="text-xs font-bold text-white truncate">{song.title}</p>
                                    <p className="text-[10px] text-white/40 uppercase font-black tracking-widest truncate">{song.artist}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center justify-between mb-6 px-1">
                            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">Tollywood Special</h2>
                            <button 
                                onClick={() => {
                                    const tollySongs = MOCK_SONGS.filter(s => s.genre === 'Tollywood');
                                    setCurrentQueue(tollySongs);
                                    setCurrentSong(tollySongs[0]);
                                    setIsPlaying(true);
                                }}
                                className="text-[10px] font-black text-[#FF0000] uppercase tracking-widest hover:underline"
                            >
                                Play All
                            </button>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                            {MOCK_SONGS.filter(s => s.genre === 'Tollywood').map((song) => (
                                <div 
                                    key={`tolly-${song.id}`}
                                    onClick={() => {
                                        const tollySongs = MOCK_SONGS.filter(s => s.genre === 'Tollywood');
                                        setCurrentQueue(tollySongs);
                                        setCurrentSong(song);
                                        setIsPlaying(true);
                                    }}
                                    className="min-w-[160px] group cursor-pointer"
                                >
                    <div className="aspect-square rounded-xl overflow-hidden mb-3 relative">
                                        <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" referrerPolicy="no-referrer" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="w-10 h-10 bg-[#FF0000] rounded-full flex items-center justify-center shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                                <Play className="w-5 h-5 text-black fill-black ml-0.5" />
                                            </div>
                                        </div>
                    </div>
                                    <p className="text-xs font-bold text-white truncate">{song.title}</p>
                                    <p className="text-[10px] text-white/40 uppercase font-black tracking-widest truncate">{song.artist}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <div className="flex items-center justify-between mb-6 px-1">
                            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30">Smart Vibe</h2>
                            <div className="text-[10px] font-black text-[#FF0000] uppercase tracking-widest animate-pulse">Analyzing...</div>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden backdrop-blur-xl">
                            <div className="relative z-10">
                                <p className="text-2xl font-black italic tracking-tighter text-white uppercase mb-2">Deep Focus & Synth</p>
                                <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest leading-relaxed mb-6">
                                    Your algorithm is trending towards ambient textures and melodic synthwave. Frequency: 8.4kHz.
                                </p>
                                <div className="flex gap-4">
                                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#FF0000] w-3/4 shadow-[0_0_10px_#FF0000]" />
                                    </div>
                                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#FF0000] w-1/2 shadow-[0_0_10px_#FF0000]" />
                                    </div>
                                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#FF0000] w-4/5 shadow-[0_0_10px_#FF0000]" />
                                    </div>
                                </div>
                            </div>
                            <Sparkles className="absolute -top-4 -right-4 w-24 h-24 text-[#FF0000]/5 rotate-12" />
                        </div>
                    </section>
                    <section>
                        <h2 className="text-xs font-bold uppercase tracking-[0.2em] mb-6 text-white/30 px-1">Your mixes</h2>
                        <div className="space-y-3">
                            {MOCK_SONGS.slice(0, 3).map((song, i) => (
                                <div 
                                    key={`mix-${song.id}`} 
                                    className="flex items-center gap-4 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all cursor-pointer group border border-white/5"
                                    onClick={() => {
                                        setCurrentQueue(MOCK_SONGS.slice(0, 3));
                                        setCurrentSong(song);
                                        setIsPlaying(true);
                                    }}
                                >
                                    <div className={cn(
                                        "w-12 h-12 rounded-lg flex items-center justify-center font-black italic text-white shadow-lg",
                                        `bg-gradient-to-br from-${['indigo-600', 'rose-600', 'orange-600'][i % 3]} to-black/60`
                                    )}>M{i+1}</div>
                                    <div className="flex-1">
                                        <p className="text-sm font-black uppercase tracking-tight">{song.title} Mix</p>
                                        <p className="text-[10px] text-white/40 uppercase tracking-widest">{song.artist}, {song.album}</p>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); toggleLyricsQueue(song.id); }}
                                        className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all",
                                            lyricsQueue.has(song.id) ? "bg-[#FF0000] text-black" : "bg-white/5 text-white/40 hover:text-[#FF0000] hover:bg-[#FF0000]/10"
                                        )}
                                        title={lyricsQueue.has(song.id) ? "Remove from Lyrics Queue" : "Add to Lyrics Queue"}
                                    >
                                        <ListMusic className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setViewingSong(song); }}
                                        className="w-8 h-8 rounded-full bg-white/5 text-white/40 hover:text-[#FF0000] hover:bg-[#FF0000]/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                                        title="View Lyrics"
                                    >
                                        <Languages className="w-4 h-4" />
                                    </button>
                                    {downloadingSongs[song.id] !== undefined ? (
                                        <div className="w-8 h-8 rounded-full border border-[#FF0000]/20 flex items-center justify-center">
                                            <Loader2 className="w-3 h-3 animate-spin text-[#FF0000]" />
                                        </div>
                                    ) : downloadedSongs.has(song.id) ? (
                                        <CheckCircle2 className="w-4 h-4 text-[#FF0000]" />
                                    ) : (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDownload(song); }}
                                            className="w-8 h-8 rounded-full bg-white/5 text-white/40 hover:text-[#FF0000] hover:bg-[#FF0000]/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {importedSongs.length > 0 && (
                        <section>
                            <h2 className="text-xs font-bold uppercase tracking-[0.2em] mb-6 text-white/30 px-1">Your Imports</h2>
                            <div className="space-y-3">
                                {importedSongs.map((song) => (
                                    <div 
                                        key={`imp-${song.id}`} 
                                        className="flex items-center gap-4 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all cursor-pointer group border border-white/5"
                                        onClick={() => {
                                            setCurrentQueue(importedSongs);
                                            setCurrentSong(song);
                                            setIsPlaying(true);
                                        }}
                                    >
                                        <img src={song.coverUrl} className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                                        <div className="flex-1">
                                            <p className="text-sm font-black uppercase tracking-tight">{song.title}</p>
                                            <p className="text-[10px] text-white/40 uppercase tracking-widest">{song.artist}</p>
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); toggleLyricsQueue(song.id); }}
                                            className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all",
                                                lyricsQueue.has(song.id) ? "bg-[#FF0000] text-black" : "bg-white/5 text-white/40 hover:text-[#FF0000] hover:bg-[#FF0000]/10"
                                            )}
                                            title={lyricsQueue.has(song.id) ? "Remove from Lyrics Queue" : "Add to Lyrics Queue"}
                                        >
                                            <ListMusic className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setViewingSong(song); }}
                                            className="w-8 h-8 rounded-full bg-white/5 text-white/40 hover:text-[#FF0000] hover:bg-[#FF0000]/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all font-black uppercase tracking-widest"
                                            title="View Lyrics"
                                        >
                                            <Languages className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setCurrentQueue(importedSongs);
                                                setCurrentSong(song);
                                                setIsPlaying(true);
                                            }}
                                            className="w-8 h-8 rounded-full bg-[#FF0000]/10 text-[#FF0000] hover:bg-[#FF0000]/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all font-black uppercase tracking-widest shadow-[0_0_10px_rgba(255,0,0,0.2)]"
                                        >
                                            <Play className="w-4 h-4 fill-current ml-0.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </main>

      {/* Player Bar */}
      <footer className="h-24 fixed bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-white/5 px-6 flex items-center justify-between z-50 backdrop-blur-xl bg-opacity-95">
        {/* Current Song */}
        <div className="flex items-center gap-4 w-1/4 min-w-[240px]">
          {currentSong && (
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentSong.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-4 group"
              >
                <div className="w-14 h-14 bg-gradient-to-bl from-[#FF0000] to-black rounded-lg overflow-hidden shadow-2xl relative">
                  <img 
                    src={currentSong.coverUrl} 
                    alt={currentSong.title} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <Heart 
                       className={cn("w-5 h-5 transition-colors cursor-pointer", favorites.has(currentSong.id) ? "text-[#FF0000] fill-current" : "text-white/80 hover:text-[#FF0000]")} 
                       onClick={(e) => {
                         e.stopPropagation();
                         toggleFavorite(currentSong.id);
                       }}
                     />
                  </div>
                </div>
                <div className="overflow-hidden min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black truncate uppercase tracking-tight cursor-pointer hover:text-[#FF0000] transition-colors">{currentSong.title}</p>
                    {downloadedSongs.has(currentSong.id) && (
                        <CheckCircle2 className="w-3 h-3 text-[#FF0000]" />
                    )}
                  </div>
                  <p className="text-[10px] text-white/50 uppercase tracking-widest truncate">
                    {currentSong.artist} • {currentSong.album}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Player Controls */}
        <div className="flex flex-col items-center gap-1 flex-1 max-w-lg relative">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-0 invisible md:visible">
            <Visualizer isPlaying={isPlaying} />
          </div>
          <div className="flex items-center gap-8 relative z-10">
            <Shuffle 
                onClick={toggleShuffle}
                className={cn("w-4 h-4 cursor-pointer transition-colors", isShuffleOn ? "text-[#FF0000]" : "text-white/30 hover:text-white")} 
            />
            <SkipBack 
                onClick={playPrevious}
                className="w-6 h-6 text-white hover:text-[#FF0000] cursor-pointer fill-current transition-colors" 
            />
            <button 
              onClick={togglePlay}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl"
            >
              {isPlaying ? (
                <div className="flex gap-1">
                  <div className="w-1.5 h-4 bg-black rounded-sm" />
                  <div className="w-1.5 h-4 bg-black rounded-sm" />
                </div>
              ) : (
                <Play className="w-5 h-5 text-black fill-black ml-0.5" />
              )}
            </button>
            <SkipForward 
                onClick={() => playNext(true)}
                className="w-6 h-6 text-white hover:text-[#FF0000] cursor-pointer fill-current transition-colors" 
            />
            <div className="relative group/repeat">
                <Repeat 
                    onClick={toggleRepeat}
                    className={cn(
                        "w-4 h-4 cursor-pointer transition-colors", 
                        repeatMode !== 'off' ? "text-[#FF0000]" : "text-white/30 hover:text-white"
                    )} 
                />
                {repeatMode === 'one' && (
                    <div className="absolute -top-1.5 -right-1.5 bg-[#FF0000] text-black text-[7px] font-black w-3 h-3 rounded-full flex items-center justify-center pointer-events-none">
                        1
                    </div>
                )}
            </div>
          </div>

          <div className="w-full flex items-center gap-3">
            <span className="text-[10px] text-white/30 font-mono w-10 text-right">{formatTime(progress)}</span>
            <div 
              className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden relative group cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const pct = x / rect.width;
                seek(pct * (currentSong?.duration || 0));
              }}
            >
              <motion.div 
                className="h-full bg-[#FF0000] relative" 
                animate={{ width: `${(progress / (currentSong?.duration || 1)) * 100}%` }}
                transition={{ type: "tween", duration: 0.1 }}
              >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            </div>
            <span className="text-[10px] text-white/30 font-mono w-10">{formatTime(currentSong?.duration || 0)}</span>
          </div>
        </div>

        {/* Volume & Misc */}
        <div className="flex items-center justify-end gap-5 w-1/4">
          <div className="relative">
            <button 
              onClick={() => setShowSleepTimerMenu(!showSleepTimerMenu)}
              className={cn(
                "flex flex-col items-center gap-0.5 transition-all group",
                sleepTimer !== null ? "text-[#FF0000]" : "text-white/40 hover:text-white"
              )}
            >
              <Clock className="w-5 h-5" />
              {sleepTimer !== null && (
                <span className="text-[8px] font-bold tracking-tighter">
                  {formatSleepTime(sleepTimer)}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showSleepTimerMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full right-0 mb-4 w-48 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-xl"
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#FF0000] p-2 mb-1">Sleep Timer</p>
                  {[5, 15, 30, 45, 60].map(mins => (
                    <button 
                      key={mins}
                      onClick={() => setTimer(mins)}
                      className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-white/5 rounded-lg transition-colors flex justify-between group"
                    >
                      <span>{mins} minutes</span>
                      {sleepTimer === mins * 60 && <div className="w-1.5 h-1.5 bg-[#FF0000] rounded-full self-center" />}
                    </button>
                  ))}
                  <div className="px-2 pb-2 mt-1 border-t border-white/5 pt-2">
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-2 ml-1">Custom Minutes</p>
                    <div className="flex gap-2">
                      <input 
                        type="number"
                        placeholder="Min"
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-[#FF0000] transition-colors"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = parseInt((e.target as HTMLInputElement).value);
                            if (!isNaN(val) && val > 0) setTimer(val);
                          }
                        }}
                      />
                      <button 
                        onClick={(e) => {
                          const input = (e.currentTarget.previousSibling as HTMLInputElement);
                          const val = parseInt(input.value);
                          if (!isNaN(val) && val > 0) setTimer(val);
                        }}
                        className="bg-[#FF0000] text-black px-2 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                      >
                        Set
                      </button>
                    </div>
                  </div>
                  {sleepTimer !== null && (
                    <button 
                      onClick={() => { setSleepTimer(null); setShowSleepTimerMenu(false); }}
                      className="w-full text-left px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-lg transition-colors mt-1"
                    >
                      Turn Off
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button 
                onClick={() => setShowEqualizer(!showEqualizer)}
                className={cn(
                    "p-2 rounded-full transition-all",
                    showEqualizer ? "bg-[#FF0000] text-black" : "text-white/40 hover:text-white"
                )}
                title="Equalizer"
            >
                <Sliders className="w-5 h-5" />
            </button>
          <button 
            onClick={handleToggleLyrics}
            className={cn("transition-colors", showLyrics ? "text-[#FF0000]" : "text-white/40 hover:text-white")}
          >
            <Languages className="w-5 h-5" />
          </button>
          <button 
            onClick={() => {
                setShowLyricsQueue(!showLyricsQueue);
                if (!showLyricsQueue) {
                    setShowSearch(false);
                    setShowFavorites(false);
                    setSelectedPlaylistId(null);
                    setViewingSong(null);
                    setShowDownloaded(false);
                    setShowAiGenerator(false);
                }
            }}
            className={cn("transition-colors", showLyricsQueue ? "text-[#FF0000]" : "text-white/40 hover:text-white")}
          >
            <ListMusic className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 w-32 group">
            <Volume2 className="w-4 h-4 text-white/40 shrink-0 group-hover:text-white transition-colors" />
            <div 
              className="h-1 flex-1 bg-white/10 rounded-full cursor-pointer relative overflow-hidden group/bar"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                setVolume(Math.max(0, Math.min(1, x / rect.width)));
              }}
            >
              <motion.div 
                className="h-full bg-white group-hover/bar:bg-[#FF0000] relative" 
                animate={{ width: `${volume * 100}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            </div>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {showEqualizer && (
            <EqualizerUI 
                levels={eqLevels} 
                setLevels={setEqLevels} 
                presets={eqPresets}
                setPresets={setEqPresets}
                onClose={() => setShowEqualizer(false)} 
            />
        )}
      </AnimatePresence>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

function SidebarItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <div 
        onClick={onClick}
        className={cn(
            "flex items-center gap-4 px-2 py-1.5 cursor-pointer transition-all duration-200 group rounded-md mx-[-8px] px-[16px]",
            active ? "text-white bg-white/5" : "text-zinc-400 hover:text-white"
        )}
    >
      <div className={cn("transition-transform group-hover:scale-110", active && "scale-105")}>{icon}</div>
      <span className="text-sm font-bold">{label}</span>
    </div>
  );
}

function SongCard({ song, isActive, onPlay, onViewDetail, isOffline, onToggleOffline, playlists, onAddToPlaylist, onRemoveFromPlaylist, isInPlaylist, isLiked, onToggleLike, isDownloaded, downloadProgress, onDownload, isInLyricsQueue, onToggleLyricsQueue }: { 
  song: Song, 
  isActive: boolean, 
  onPlay: () => void, 
  onViewDetail?: () => void, 
  isOffline?: boolean, 
  onToggleOffline?: () => void,
  playlists?: Playlist[],
  onAddToPlaylist?: (playlistId: string) => void,
  onRemoveFromPlaylist?: () => void,
  isInPlaylist?: boolean,
  isLiked?: boolean,
  onToggleLike?: () => void,
  isDownloaded?: boolean,
  downloadProgress?: number,
  onDownload?: () => void,
  isInLyricsQueue?: boolean,
  onToggleLyricsQueue?: () => void,
  key?: React.Key 
}) {
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);

  const isAvailable = navigator.onLine || isDownloaded;

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className={cn(
        "bg-[#181818] p-4 rounded-lg hover:bg-[#282828] transition-all group cursor-pointer relative shadow-lg",
        isActive && "bg-[#282828]",
        !isAvailable && "opacity-40 grayscale pointer-events-none"
      )}
      onClick={onViewDetail}
    >
      {!isAvailable && (
          <div className="absolute top-2 right-2 z-50">
              <div className="bg-red-500 text-[8px] font-black uppercase tracking-tightest px-2 py-0.5 rounded-full text-white shadow-lg">Offline Only</div>
          </div>
      )}
      <div className="relative aspect-square mb-4 shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
        <img 
          src={song.coverUrl} 
          alt={song.title} 
          className="w-full h-full object-cover rounded transform transition-transform group-hover:scale-[1.02]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded" />
        
        <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
                className={cn(
                    "p-1.5 rounded-full backdrop-blur-md transition-all relative overflow-hidden",
                    downloadProgress !== undefined ? "bg-white/10 text-white" :
                    isDownloaded ? "bg-[#FF0000] text-black shadow-[0_0_10px_#FF0000]" :
                    isOffline ? "bg-[#FF0000] text-black" : "bg-black/40 text-white/40 hover:text-white"
                )}
                onClick={(e) => {
                    e.stopPropagation();
                    if (!isDownloaded && downloadProgress === undefined) {
                        onDownload?.();
                    } else if (isDownloaded) {
                        // Logic to remove download could go here if needed
                    }
                }}
            >
                {downloadProgress !== undefined ? (
                    <div className="relative w-3.5 h-3.5 flex items-center justify-center">
                        <Loader2 className="w-full h-full animate-spin opacity-40" />
                        <div className="absolute inset-0 flex items-center justify-center text-[6px] font-bold">
                            {Math.round(downloadProgress)}
                        </div>
                    </div>
                ) : isDownloaded ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                    <Download className="w-3.5 h-3.5" />
                )}
                
                {downloadProgress !== undefined && (
                    <div 
                        className="absolute bottom-0 left-0 h-0.5 bg-[#FF0000] transition-all" 
                        style={{ width: `${downloadProgress}%` }}
                    />
                )}
            </button>

            <button 
                className={cn(
                    "p-1.5 rounded-full backdrop-blur-md transition-all",
                    isInLyricsQueue ? "bg-[#FF0000] text-black" : "bg-black/40 text-white/40 hover:text-white"
                )}
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleLyricsQueue?.();
                }}
                title={isInLyricsQueue ? "Remove from Lyrics Queue" : "Add to Lyrics Queue"}
            >
                <ListMusic className="w-3.5 h-3.5" />
            </button>

            <button 
                className={cn(
                    "p-1.5 rounded-full backdrop-blur-md transition-all",
                    isLiked ? "bg-[#FF0000] text-black" : "bg-black/40 text-white/40 hover:text-white"
                )}
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleLike?.();
                }}
            >
                <Heart className={cn("w-3.5 h-3.5", isLiked && "fill-current")} />
            </button>
            
            <div className="relative">
                <button 
                    className="p-1.5 rounded-full bg-black/40 text-white/40 hover:text-white hover:bg-black/60 backdrop-blur-md transition-all"
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowPlaylistMenu(!showPlaylistMenu);
                    }}
                >
                    <PlusSquare className="w-3.5 h-3.5" />
                </button>
                
                <AnimatePresence>
                    {showPlaylistMenu && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute left-0 top-full mt-2 w-48 bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 p-1"
                        >
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 p-2 border-b border-white/5 mb-1">Add to Playlist</p>
                            <div className="max-h-40 overflow-y-auto scrollbar-hide">
                                {playlists?.map(p => (
                                    <button 
                                        key={p.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAddToPlaylist?.(p.id);
                                            setShowPlaylistMenu(false);
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-white/10 rounded-lg transition-colors truncate italic"
                                    >
                                        {p.name}
                                    </button>
                                ))}
                                {(!playlists || playlists.length === 0) && (
                                    <p className="text-[10px] text-white/20 p-2 italic">Create a playlist first</p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {isInPlaylist && (
                <button 
                    className="p-1.5 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 backdrop-blur-md transition-all"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFromPlaylist?.();
                    }}
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            )}

            <button 
                className="p-1.5 rounded-full bg-black/40 text-white/40 hover:text-[#FF0000] hover:bg-black/60 backdrop-blur-md transition-all"
                onClick={(e) => {
                    e.stopPropagation();
                    onViewDetail?.();
                }}
                title="View Lyrics"
            >
                <Languages className="w-3.5 h-3.5" />
            </button>
        </div>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
          className={cn(
            "absolute bottom-2 right-2 w-12 h-12 bg-[#FF0000] rounded-full shadow-[0_8px_16px_rgba(0,0,0,0.3)] flex items-center justify-center transition-all duration-300 opacity-0 transform translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 hover:scale-105 active:scale-95",
            isActive && "opacity-100 translate-y-0"
          )}
        >
          <Play className="w-6 h-6 text-black fill-black ml-1" />
        </button>
      </div>
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0 flex-1">
            <h3 className="font-bold text-base mb-1 line-clamp-1 text-white uppercase tracking-tight italic">{song.title}</h3>
            <p className="text-zinc-500 text-xs line-clamp-1 leading-tight uppercase font-bold tracking-wider">{song.artist}</p>
            {song.reason && (
              <p className="text-[9px] text-[#FF0000] mt-1 italic font-bold uppercase tracking-tight line-clamp-2 leading-none opacity-80 group-hover:opacity-100 transition-opacity">
                // {song.reason}
              </p>
            )}
        </div>
        {isOffline && (
            <div className="w-1.5 h-1.5 rounded-full bg-[#FF0000] mt-2 shrink-0 shadow-[0_0_5px_#FF0000]" title="Available offline" />
        )}
      </div>
    </motion.div>
  );
}

function EqualizerUI({ levels, setLevels, presets, setPresets, onClose }: { levels: any, setLevels: any, presets: any[], setPresets: any, onClose: () => void }) {
  const [newPresetName, setNewPresetName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;
    setPresets([...presets, { name: newPresetName, levels: { ...levels } }]);
    setNewPresetName("");
    setIsSaving(false);
  };

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 20, opacity: 0, scale: 0.95 }}
      className="fixed bottom-28 right-8 bg-zinc-900/90 backdrop-blur-2xl p-8 rounded-[2rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] border border-white/10 z-[100] w-80 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#FF0000]/5 to-transparent pointer-events-none" />
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FF0000]/10 flex items-center justify-center overflow-hidden">
                <Sliders className="w-4 h-4 text-[#FF0000]" />
            </div>
            <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#FF0000]">Sonic EQ</h3>
                <p className="text-[8px] text-white/30 font-bold uppercase tracking-widest">Mastering Mode</p>
            </div>
        </div>
        <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/20 hover:text-white hover:bg-white/5 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mb-8 relative z-10">
        <label className="text-[8px] font-black uppercase tracking-widest text-white/30 ml-2 mb-2 block">Active Preset</label>
        <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
                <button 
                    key={p.name}
                    onClick={() => setLevels(p.levels)}
                    className={cn(
                        "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border",
                        JSON.stringify(levels) === JSON.stringify(p.levels) 
                            ? "bg-[#FF0000] text-black border-[#FF0000]" 
                            : "bg-white/5 text-white/40 border-white/10 hover:border-white/30 hover:text-white"
                    )}
                >
                    {p.name}
                </button>
            ))}
            <button 
                onClick={() => setIsSaving(!isSaving)}
                className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all"
            >
                {isSaving ? <X className="w-3 h-3" /> : <PlusSquare className="w-3 h-3" />}
            </button>
        </div>
        
        <AnimatePresence>
            {isSaving && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 overflow-hidden"
                >
                    <div className="flex gap-2">
                        <input 
                            value={newPresetName}
                            onChange={(e) => setNewPresetName(e.target.value)}
                            placeholder="Preset Name..."
                            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] font-bold text-white focus:outline-none focus:border-[#FF0000] transition-colors"
                        />
                        <button 
                            onClick={handleSavePreset}
                            className="bg-[#FF0000] text-black px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                        >
                            Save
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      <div className="flex justify-between items-end h-36 gap-5 relative z-10">
        {Object.entries(levels).map(([band, val]: [string, any]) => (
          <div key={band} className="flex flex-col items-center flex-1 gap-4 h-full pt-4">
            <div className="relative h-full w-2 bg-white/5 rounded-full overflow-hidden group">
              <motion.div 
                className="absolute bottom-0 w-full bg-gradient-to-t from-[#FF0000] to-[#ff3333] shadow-[0_0_15px_rgba(255,0,0,0.4)]"
                animate={{ height: `${val}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
              <input 
                type="range"
                min="0"
                max="100"
                value={val}
                onChange={(e) => setLevels({ ...levels, [band]: parseInt(e.target.value) })}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer [writing-mode:bt-lr]"
                style={{ appearance: 'slider-vertical' as any }}
              />
            </div>
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30 group-hover:text-white transition-colors">{band}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-white/5 relative z-10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <button 
                onClick={() => setLevels({ bass: 50, mid: 50, treble: 50, gain: 50 })}
                className="text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white hover:bg-[#FF0000]/10 px-3 py-1.5 rounded-lg transition-all"
            >
                Reset Flat
            </button>
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF0000] shadow-[0_0_8px_rgba(255,0,0,0.6)]" />
                <span className="text-[9px] font-black uppercase tracking-widest text-[#FF0000]">Neural Engine Active</span>
            </div>
        </div>
      </div>
    </motion.div>
  );
}

function Visualizer({ isPlaying }: { isPlaying: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | null>(null);
  
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
  
      const bars = 25;
      const barWidth = 3;
      const barGap = 2;
      const heights = new Array(bars).fill(2);
      const targetHeights = new Array(bars).fill(2);
  
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#FF0000');
        gradient.addColorStop(1, '#ff3333');
  
        for (let i = 0; i < bars; i++) {
          if (isPlaying) {
            if (Math.random() > 0.88) {
              targetHeights[i] = Math.random() * canvas.height * 0.9 + 2;
            }
          } else {
            targetHeights[i] = 1;
          }
  
          const speed = isPlaying ? 0.15 : 0.05;
          heights[i] += (targetHeights[i] - heights[i]) * speed;
  
          const x = i * (barWidth + barGap);
          const y = canvas.height - heights[i];
          
          ctx.fillStyle = gradient;
          // @ts-ignore
          if (ctx.roundRect) {
              // @ts-ignore
              ctx.roundRect(x, y, barWidth, heights[i], [2, 2, 0, 0]);
          } else {
              ctx.rect(x, y, barWidth, heights[i]);
          }
          ctx.fill();
        }
  
        animationRef.current = requestAnimationFrame(animate);
      };
  
      animate();
  
      return () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      };
    }, [isPlaying]);
  
    return (
      <div className="flex items-end justify-center h-8 w-[125px]">
        <canvas 
          ref={canvasRef} 
          width={25 * (3 + 2)} 
          height={32} 
          className="opacity-80"
        />
      </div>
    );
  }
