import SearchInput from '../SearchInput';

export default function SearchInputExample() {
  return (
    <div className="space-y-8">
      <SearchInput 
        onSearch={(query) => console.log('Search query:', query)} 
      />
      
      <SearchInput 
        onSearch={(query) => console.log('Search query:', query)}
        recentQueries={["Is NBAY 5500 pass/fail?", "Credits for INFO 2950?"]}
        onClearRecent={() => console.log('Clear recent')}
      />
    </div>
  );
}
