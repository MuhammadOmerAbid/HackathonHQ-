"use client";

import React, { useState } from "react";
import axios from "../../utils/axios";

export default function JudgeFeedbackForm({ submissionId, onFeedbackSaved }) {
  const [score, setScore] = useState("");
  const [comment, setComment] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/feedback/", {
        submission: submissionId,
        score: parseFloat(score),
        comment,
      });
      setScore("");
      setComment("");
      if (onFeedbackSaved) onFeedbackSaved();
      alert("Feedback submitted!");
    } catch (err) {
      console.error("Error submitting feedback:", err);
      alert("Failed to submit feedback.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-4 border rounded-lg bg-gray-50">
      <input
        type="number"
        placeholder="Score"
        value={score}
        onChange={(e) => setScore(e.target.value)}
        className="p-2 border rounded"
        required
      />
      <textarea
        placeholder="Comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="p-2 border rounded"
        required
      />
      <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">
        Submit Feedback
      </button>
    </form>
  );
}