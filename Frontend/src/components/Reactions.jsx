"use client";
import {useState, useEffect} from "react";
import {likeAnswer, ayeAnswer, hasLiked, hasAyed } from "../data/firestore"

function ReactionButtons({answer, user}) {
    const [liked, setLiked] = useState(false);
    const [ayed, setAyed] = useState(false);
    const [likeCount, setLikeCount] = useState(answer.likeCount || 0);
    const [ayeCount, setAyeCount] = useState(answer.ayeCount || 0);

    useEffect(() => {
        if(!user) return
        async function checkInteractions() {
            const [userLiked, userAyed] = await Promise.all([
                hasLiked(user.uid, answer.id),
                hasAyed(user.uid, answer.id)
            ])
            setLiked(userLiked)
            setAyed(userAyed)
        }
        checkInteractions()
    }, [user, answer.id])

    async function handleLike() {
        if (!user) {
            alert("Please sign in to react")
            return
        }
        const isNowLiked = await likeAnswer(user.uid, answer.id)
        setLiked(isNowLiked)
        setLikeCount(prev => isNowLiked ? prev + 1 : prev - 1)
    }

    async function handleAye() {
        if (!user) {
            alert("Please sign in to react")
            return
        }
        const isNowAyed = await ayeAnswer(user.uid, answer.id)
        setAyed(isNowAyed)
        setAyeCount(prev => isNowAyed ? prev + 1 : prev - 1)
    }

    return (
        <div className="reactions">
            <button 
                className={`reaction-btn like-btn ${liked ? "active" : ""}`} 
                onClick={handleLike}>♥ {likeCount}</button>
            <button className={`reaction-btn aye-btn ${ayed ? "active" : ""}`} 
            onClick={handleAye}>✦ {ayeCount}</button>
        </div>
    )
}

export default ReactionButtons;