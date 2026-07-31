import { useState, useEffect } from 'react';
import { useGetConfig, useUpdateConfig, getGetConfigQueryKey } from '@workspace/api-client-react';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Save, Settings } from 'lucide-react';

const VOICE_OPTIONS = [
  'alloy',
  'ash',
  'ballad',
  'coral',
  'echo',
  'sage',
  'shimmer',
  'verse',
] as const;

export default function Config() {
  const { data: config, isLoading } = useGetConfig();
  const updateConfig = useUpdateConfig();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [systemPrompt, setSystemPrompt] = useState('');
  const [voice, setVoice] = useState('alloy');
  const [greeting, setGreeting] = useState('');

  // Initialize form when config loads
  useEffect(() => {
    if (config) {
      setSystemPrompt(config.systemPrompt);
      setVoice(config.voice);
      setGreeting(config.greeting);
    }
  }, [config]);

  const handleSave = () => {
    updateConfig.mutate(
      {
        data: {
          systemPrompt,
          voice,
          greeting,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetConfigQueryKey() });
          toast({
            title: 'Configuration saved',
            description: 'Agent settings have been updated successfully.',
          });
        },
        onError: (error) => {
          toast({
            title: 'Save failed',
            description: error.message || 'Failed to update configuration.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const hasChanges =
    config &&
    (systemPrompt !== config.systemPrompt ||
      voice !== config.voice ||
      greeting !== config.greeting);

  return (
    <Layout>
      <div className="p-6 space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agent Configuration</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure the AI voice agent's behavior and voice settings
          </p>
        </div>

        {isLoading ? (
          <div className="bg-card border border-card-border rounded-lg p-6 space-y-6">
            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
            <div className="h-32 w-full bg-muted animate-pulse rounded" />
            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
            <div className="h-10 w-full bg-muted animate-pulse rounded" />
          </div>
        ) : (
          <div className="bg-card border border-card-border rounded-lg p-6 space-y-6">
            {/* System Prompt */}
            <div className="space-y-2">
              <Label htmlFor="system-prompt" className="text-base font-semibold">
                System Prompt
              </Label>
              <p className="text-sm text-muted-foreground mb-3">
                Define the agent's personality, knowledge, and behavior
              </p>
              <Textarea
                id="system-prompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={12}
                className="font-mono text-sm resize-none"
                placeholder="You are a helpful AI assistant for an apartment complex..."
                data-testid="input-system-prompt"
              />
            </div>

            {/* Voice */}
            <div className="space-y-2">
              <Label htmlFor="voice" className="text-base font-semibold">
                Voice
              </Label>
              <p className="text-sm text-muted-foreground mb-3">
                Select the agent's voice characteristic
              </p>
              <Select value={voice} onValueChange={setVoice}>
                <SelectTrigger id="voice" className="w-full md:w-64" data-testid="select-voice">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VOICE_OPTIONS.map((voiceOption) => (
                    <SelectItem key={voiceOption} value={voiceOption}>
                      {voiceOption.charAt(0).toUpperCase() + voiceOption.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Greeting */}
            <div className="space-y-2">
              <Label htmlFor="greeting" className="text-base font-semibold">
                Greeting Message
              </Label>
              <p className="text-sm text-muted-foreground mb-3">
                The initial message callers hear when the agent answers
              </p>
              <Textarea
                id="greeting"
                value={greeting}
                onChange={(e) => setGreeting(e.target.value)}
                rows={4}
                className="resize-none"
                placeholder="Hello, you've reached the after-hours line for..."
                data-testid="input-greeting"
              />
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-card-border flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {config && (
                  <span>
                    Last updated:{' '}
                    {new Date(config.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || updateConfig.isPending}
                className="gap-2"
                data-testid="button-save"
              >
                {updateConfig.isPending ? (
                  <>
                    <Settings className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
