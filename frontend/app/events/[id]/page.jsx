"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "../../../utils/axios";

export default function EventDetailPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await axios.get(`/events/${id}/`);
        setEvent(res.data);
      } catch (err) {
        console.error("Error fetching event:", err);
      }
    };

    const fetchTeams = async () => {
      try {
        const res = await axios.get(`/events/${id}/teams/`);
        setTeams(res.data);
      } catch (err) {
        console.error("Error fetching teams:", err);
      }
    };

    fetchEvent();
    fetchTeams();
  }, [id]);

  if (!event) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">{event.name}</h1>
      <p className="text-gray-700 mb-2">{event.description}</p>
      <p className="text-gray-500 mb-4">
        {new Date(event.start_date).toLocaleDateString()} -{" "}
        {new Date(event.end_date).toLocaleDateString()}
      </p>
      <p className="text-gray-600 mb-6">Organizer: {event.organizer.username}</p>
      {event.is_premium && <span className="text-yellow-500 font-semibold mb-6">Premium Event</span>}

      <h2 className="text-2xl font-bold mb-4">Teams</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.length > 0 ? (
          teams.map((team) => (
            <div
              key={team.id}
              className="p-4 border rounded-lg shadow hover:shadow-md transition bg-white"
            >
              <h3 className="text-lg font-bold">{team.name}</h3>
              <p className="text-gray-600 text-sm">
                Members: {team.members.map((m) => m.username).join(", ")}
              </p>
            </div>
          ))
        ) : (
          <p>No teams yet.</p>
        )}
      </div>
    </div>
  );
}