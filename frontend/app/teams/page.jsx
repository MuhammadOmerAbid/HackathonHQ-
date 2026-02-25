"use client";

import React, { useEffect, useState } from "react";
import axios from "../../utils/axios";
import Link from "next/link";

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await axios.get("/teams/"); // get all teams
        // filter teams where the current user is a member
        const userTeams = res.data.results.filter(team =>
          team.members.some(member => member.id === parseInt(localStorage.getItem("user_id")))
        );
        setTeams(userTeams);
      } catch (err) {
        console.error("Error fetching teams:", err);
      }
    };
    fetchTeams();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">My Teams</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.length > 0 ? (
          teams.map((team) => (
            <Link key={team.id} href={`/teams/${team.id}`}>
              <div className="p-4 border rounded-lg shadow hover:shadow-md transition bg-white cursor-pointer">
                <h2 className="text-xl font-bold">{team.name}</h2>
                <p className="text-gray-600 text-sm">
                  Members: {team.members.map(m => m.username).join(", ")}
                </p>
              </div>
            </Link>
          ))
        ) : (
          <p>You are not in any teams yet.</p>
        )}
      </div>
    </div>
  );
}