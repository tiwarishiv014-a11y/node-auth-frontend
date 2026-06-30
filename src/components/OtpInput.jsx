// src/components/OtpInput.jsx
// Drop-in 6-box OTP input — auto-advance, backspace, paste support
import { useRef, useState, useEffect } from 'react';

function OtpInput({ value, onChange, disabled }) {
    const [digits, setDigits] = useState(Array(6).fill(''));
    const inputs = useRef([]);

    // Keep parent's `value` in sync (e.g. if parent clears it)
    useEffect(() => {
        if (!value) setDigits(Array(6).fill(''));
    }, [value]);

    const focus = (i) => inputs.current[i]?.focus();

    const update = (newDigits) => {
        setDigits(newDigits);
        onChange(newDigits.join(''));
    };

    const handleChange = (e, i) => {
        const val = e.target.value.replace(/\D/g, '').slice(-1); // digits only, last char
        const next = [...digits];
        next[i] = val;
        update(next);
        if (val && i < 5) focus(i + 1);
    };

    const handleKeyDown = (e, i) => {
        if (e.key === 'Backspace') {
            e.preventDefault();
            const next = [...digits];
            if (next[i]) {
                next[i] = '';
                update(next);
            } else if (i > 0) {
                next[i - 1] = '';
                update(next);
                focus(i - 1);
            }
        } else if (e.key === 'ArrowLeft' && i > 0) {
            focus(i - 1);
        } else if (e.key === 'ArrowRight' && i < 5) {
            focus(i + 1);
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!pasted) return;
        const next = Array(6).fill('');
        pasted.split('').forEach((ch, i) => { next[i] = ch; });
        update(next);
        focus(Math.min(pasted.length, 5));
    };

    return (
        <div className="otp-boxes" onPaste={handlePaste}>
            {digits.map((d, i) => (
                <input
                    key={i}
                    ref={(el) => (inputs.current[i] = el)}
                    className={`otp-box${d ? ' otp-box--filled' : ''}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    disabled={disabled}
                    autoFocus={i === 0}
                    onChange={(e) => handleChange(e, i)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                    onFocus={(e) => e.target.select()}
                    aria-label={`OTP digit ${i + 1}`}
                />
            ))}
        </div>
    );
}

export default OtpInput;