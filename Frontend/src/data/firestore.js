import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
  query,
  orderBy,
  where,
  onSnapshot,
  deleteDoc
} from "firebase/firestore";

//QUESTIONS
export async function addQuestion(text, tag, user) {
  const question = await addDoc(collection(db, "questions"), {
    text,
    tag,
    userId: user.uid,
    askedAt: serverTimestamp(),
    isAnswered: false,
    isPinned: false,
    answerCount: 0,
  });
  await setDoc(doc(db, "users", user.uid), {
    questionsAsked: increment(1),
  }, {merge:true});
  return question;
}

export function listenToQuestions(callback) {
  const q = query(collection(db, "questions"), orderBy("askedAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const questions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(questions);
  });
}

//ANSWERS
export async function addAnswer(questionId, text, user) {
  const answer = await addDoc(collection(db, "answers"), {
    questionId,
    text,
    userId: user.uid,
    userName: user.displayName || user.email,
    isTopAnswer: false,
    likeCount: 0,
    ayeCount: 0,
    createdAt: serverTimestamp(),
    comments: [],
  });
  await setDoc(doc(db, "questions", questionId), {
    answerCount: increment(1),  
    isAnswered: true,
  }, {merge: true});

  await setDoc(doc(db, "users", user.uid), {
    answersGiven: increment(1)
  }, {merge:true})
  return answer;
}

export async function getAnswersForQuestion(questionId) {
  const q = query(
    collection(db, "answers"),
    where("questionId", "==", questionId),
    orderBy("likeCount", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

//USERS
export async function createUserDoc(user) {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      name: user.displayName || "",
      email: user.email,
      joinedAt: serverTimestamp(),
      answersGiven: 0,
    });
  }
}

//LIKES
export async function likeAnswer(userId, answerId) {
  const q = query(
    collection(db, "likes"),
    where("userId", "==", userId),
    where("answerId", "==", answerId),
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    await addDoc(collection(db, "likes"), {
      userId,
      answerId,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, "answers", answerId), {
      likeCount: increment(1),
    });
    return true;
  } else {
    await deleteDoc(snapshot.docs[0].ref);
    await updateDoc(doc(db, "answers", answerId), {
      likeCount: increment(-1),
    });
    return false;
  }
}

//AYES
export async function ayeAnswer(userId, answerId) {
  const q = query(
    collection(db, "ayes"),
    where("userId", "==", userId),
    where("answerId", "==", answerId),
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    await addDoc(collection(db, "ayes"), {
      userId,
      answerId,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, "answers", answerId), {
      ayeCount: increment(1),
    });
    return true;
  } else {
    await deleteDoc(snapshot.docs[0].ref);
    await updateDoc(doc(db, "answers", answerId), {
      ayeCount: increment(-1),
    });
    return false;
  }
}

//CHECK IF USER LIKED/AYED
export async function hasLiked(userId, answerId) {
  const q = query(
    collection(db, "likes"),
    where("userId", "==", userId),
    where("answerId", "==", answerId),
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

export async function hasAyed(userId, answerId) {
  const q = query(
    collection(db, "ayes"),
    where("userId", "==", userId),
    where("answerId", "==", answerId),
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}
