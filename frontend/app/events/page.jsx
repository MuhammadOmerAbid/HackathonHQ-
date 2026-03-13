import { Suspense } from 'react';
import EventsContent from '@/components/events/EventsContent';
import LoadingSpinner from "@/components/LoadingSpinner";

export default function EventsPage() {
  return (
    <Suspense fallback={
      <div className="events-loading">
        <LoadingSpinner message="Loading hackathons..." />;
      </div>
    }>
      <EventsContent />
    </Suspense>
  );
}