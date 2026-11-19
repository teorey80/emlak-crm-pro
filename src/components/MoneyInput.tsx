import React from 'react';

interface MoneyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
    value: number;
    onChange: (value: number) => void;
}

// Tutar kutusu: yazdıkça binlik ayraçla gösterir (115000 → 115.000), sayı olarak döndürür.
const MoneyInput: React.FC<MoneyInputProps> = ({ value, onChange, ...rest }) => (
    <input
        {...rest}
        type="text"
        inputMode="numeric"
        value={value ? value.toLocaleString('tr-TR') : ''}
        onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '');
            onChange(digits ? Number(digits) : 0);
        }}
    />
);

export default MoneyInput;
