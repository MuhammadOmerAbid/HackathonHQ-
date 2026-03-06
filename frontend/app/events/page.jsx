import { Suspense } from 'react';
import EventsContent from '@/components/events/EventsContent';

export default function EventsPage() {
  return (
    <Suspense fallback={
      <div className="events-loading">
        <div className="blob blob1"></div>
        <div className="blob blob2"></div>
        <div className="blob blob3"></div>
        <div className="events-spinner"></div>
        <p>Loading hackathons...</p>
      </div>
    }>
      <EventsContent />
    </Suspense>
  );
}