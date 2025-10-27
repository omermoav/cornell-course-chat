import SearchInput from '../SearchInput';

export default function SearchInputExample() {
  return (
    <SearchInput 
      onSearch={(query) => console.log('Search query:', query)} 
    />
  );
}
