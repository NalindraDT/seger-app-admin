import React from 'react';
import {
  SelectRoot,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './shadcn/select';
import { cn } from '@/lib/utils';

const EMPTY_VALUE = '__shadcn_empty__';

function parseOptions(children) {
  return React.Children.toArray(children)
    .filter((child) => React.isValidElement(child) && child.type === 'option')
    .map((child) => ({
      value: child.props.value ?? '',
      label: child.props.children,
      disabled: Boolean(child.props.disabled),
    }));
}

function toRadixValue(value) {
  if (value === '' || value === null || value === undefined) {
    return EMPTY_VALUE;
  }
  return String(value);
}

function fromRadixValue(value) {
  if (value === EMPTY_VALUE) {
    return '';
  }
  return value;
}

export default function Select({
  children,
  value,
  onChange,
  error,
  className = '',
  selectClassName = '',
  disabled,
  required,
  name,
  id,
}) {
  const options = parseOptions(children);
  const placeholderOption = options.find((opt) => opt.disabled && String(opt.value) === '');
  const emptySelectableOption = options.find((opt) => !opt.disabled && String(opt.value) === '');
  const selectableOptions = options.filter((opt) => !(opt.disabled && String(opt.value) === ''));

  const placeholder =
    placeholderOption?.label ??
    emptySelectableOption?.label ??
    'Pilih opsi...';

  const radixValue = toRadixValue(value);
  const hasValue = selectableOptions.some((opt) => toRadixValue(opt.value) === radixValue);

  const handleValueChange = (nextValue) => {
    onChange?.({
      target: {
        value: fromRadixValue(nextValue),
        name,
      },
    });
  };

  return (
    <SelectRoot
      value={hasValue ? radixValue : undefined}
      onValueChange={handleValueChange}
      disabled={disabled}
      required={required}
      name={name}
    >
      <SelectTrigger
        id={id}
        className={cn(
          error && 'border-red-300 focus:border-red-500 focus:ring-red-500/15',
          className,
          selectClassName
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {selectableOptions.map((opt) => {
          const itemValue = toRadixValue(opt.value);
          return (
            <SelectItem key={itemValue} value={itemValue} disabled={opt.disabled}>
              {opt.label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </SelectRoot>
  );
}
