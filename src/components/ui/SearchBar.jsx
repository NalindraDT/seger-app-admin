import { Search } from 'lucide-react';
import FormField from './FormField';
import Input from './Input';

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Cari...',
  label = 'Cari',
  className = '',
}) {
  return (
    <FormField label={label} className={className}>
      <Input
        icon={Search}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        inputClassName="bg-[#F8F9FC] focus-visible:bg-white"
      />
    </FormField>
  );
}
