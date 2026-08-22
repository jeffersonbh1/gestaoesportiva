import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number; // 1 to 5
  maxStars?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showNumber?: boolean;
}

export default function StarRating({
  rating,
  maxStars = 5,
  interactive = false,
  onChange,
  size = 'sm',
  showNumber = false,
}: StarRatingProps) {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const textClasses = {
    xs: 'text-[10px]',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className="inline-flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxStars }).map((_, i) => {
          const starValue = i + 1;
          const isFilled = rating >= starValue;
          const isHalf = !isFilled && rating >= starValue - 0.5;

          return (
            <button
              key={i}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange && onChange(starValue)}
              className={`${
                interactive
                  ? 'cursor-pointer hover:scale-110 transition-transform focus:outline-none'
                  : 'cursor-default'
              } p-0.5`}
              title={`${starValue} estrela${starValue > 1 ? 's' : ''}`}
            >
              <Star
                className={`${sizeClasses[size]} ${
                  isFilled
                    ? 'fill-amber-400 text-amber-400'
                    : isHalf
                    ? 'fill-amber-300/50 text-amber-400'
                    : 'fill-slate-100 text-slate-300'
                }`}
              />
            </button>
          );
        })}
      </div>
      {showNumber && (
        <span className={`font-bold text-amber-600 ${textClasses[size]} ml-1`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
