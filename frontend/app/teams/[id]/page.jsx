"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "../../../utils/axios";

export default function TeamDetailPage() {
  const { id } = useParams();
  const [team, setTeam] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await axios.get(`/teams/${id}/`);
        setTeam(res.data);
      } catch (err) {
        console.error("Error fetching team:", err);
      }
    };

    const fetchSubmissions = async () => {
      try {
        const res = await axios.get(`/submissions/?team=${id}`);
        setSubmissions(res.data.results);
      } catch (err) {
        console.error("Error fetching submissions:", err);
      }
    };

    fetchTeam();
    fetchSubmissions();
  }, [id]);

  if (!team) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">{team.name}</h1>
      <p className="text-gray-600 mb-4">
        Members: {team.members.map(m => m.username).join(", ")}
      </p>

      <h2 className="text-2xl font-bold mb-4">Submissions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {submissions.length > 0 ? (
          submissions.map(sub => (
            <div key={sub.id} className="p-4 border rounded-lg shadow bg-white">
              <h3 className="text-lg font-bold">{sub.title}</h3>
              <p className="text-gray-700">{sub.description}</p>
              {sub.file && (
                <a href={sub.file} className="text-blue-600 underline" target="_blank">
                  Download File
                </a>
              )}
              <p className="text-gray-500 mt-2">Score: {sub.score}</p>
            </div>
          ))
        ) : (
          <p>No submissions yet.</p>
        )}
      </div>
    </div>
  );
}