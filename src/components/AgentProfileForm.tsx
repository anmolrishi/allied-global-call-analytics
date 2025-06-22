import { useState } from 'react';
import { Button } from './ui/Button';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

interface AgentProfileFormProps {
  onComplete: () => void;
}

export default function AgentProfileForm({ onComplete }: AgentProfileFormProps) {
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('agents')
        .insert({
          user_id: user.id,
          name,
          employee_id: employeeId
        });

      if (error) throw error;

      toast.success('Agent profile created successfully');
      onComplete();
    } catch (error) {
      console.error('Error creating agent profile:', error);
      toast.error('Failed to create agent profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Create Agent Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">
            Employee ID
          </label>
          <input
            type="text"
            id="employeeId"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
        <Button type="submit" isLoading={loading} disabled={loading}>
          Create Profile
        </Button>
      </form>
    </div>
  );
}