import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export default function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <Input
          type="text"
          placeholder="Search for any song, artist, or album..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input w-full h-14 px-6 pr-14 bg-gray-800/80 border-2 border-electric-blue/50 rounded-xl text-white placeholder-gray-400 focus:border-electric-blue focus:outline-none focus:ring-2 focus:ring-electric-blue/30 transition-all text-lg"
          disabled={isLoading}
        />
        <Button
          type="submit"
          size="icon"
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-electric-blue hover:text-neon-pink transition-colors bg-transparent border-0 hover:bg-transparent"
          disabled={isLoading || !query.trim()}
        >
          <Search className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
}
