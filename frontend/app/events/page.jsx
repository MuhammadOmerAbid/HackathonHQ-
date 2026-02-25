"use client";

import React, { useEffect, useState } from "react";
import axios from "../../utils/axios";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get("/events/");
        setEvents(res.data.results); // assuming backend returns a list of events
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500 text-lg">Loading events...</p>
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500 text-lg">No events available.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">All Events</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div
            key={event.id}
            className="border rounded-lg shadow-md p-4 hover:shadow-xl transition-shadow duration-200 bg-white"
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold">{event.name}</h2>
              {event.is_premium && (
                <span className="text-xs bg-yellow-400 text-white px-2 py-1 rounded">
                  PREMIUM
                </span>
              )}
            </div>
            <p className="text-gray-600 mb-3 line-clamp-3">{event.description}</p>
            <div className="text-sm text-gray-500">
              <p>
                <strong>Start:</strong>{" "}
                {new Date(event.start_date).toLocaleString()}
              </p>
              <p>
                <strong>End:</strong> {new Date(event.end_date).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}