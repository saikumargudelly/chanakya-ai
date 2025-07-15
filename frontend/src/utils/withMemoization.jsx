import React, { useMemo } from 'react';

// HOC for memoizing expensive computations
export const withMemoization = (WrappedComponent, arePropsEqual) => {
  return React.memo(({ computeFunction, dependencies = [], ...props }) => {
    const memoizedValue = useMemo(() => {
      return computeFunction();
    }, dependencies);

    return <WrappedComponent {...props} value={memoizedValue} />;
  }, arePropsEqual);
};

// Example usage:
// const ExpensiveChart = withMemoization(ChartComponent, (prevProps, nextProps) => {
//   return prevProps.data === nextProps.data;
// });