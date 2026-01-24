// User profile evaluation page
export default function UserProfile({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">User Profile Evaluation</h1>
      {/* TODO: Add user profile components */}
    </div>
  );
}
