"use client";

import React from "react";
import Link from "next/link";

export default function EventCard({ event }) {
  return (
    <div className="p-4 border rounded-lg shadow hover:shadow-md transition bg-white">
      <h2 className="text-xl font-bold mb-2">{event.name}</h2>
      <p className="text-gray-700 mb-2">{event.description}</p>
      <p className="text-gray-500 text-sm mb-2">
        {new Date(event.start_date).toLocaleDateString()} -{" "}
        {new Date(event.end_date).toLocaleDateString()}
      </p>
      <p className="text-gray-600 mb-2">
        Organizer: {event.organizer.username}
      </p>
      {event.is_premium && (
        <span className="text-yellow-500 font-semibold mb-2">Premium</span>
      )}
      <Link
        href={`/events/${event.id}`}
        className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        View Details
      </Link>
    </div>
  );
}