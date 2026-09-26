import { ValueTransformer } from 'typeorm';

// Копия лр1/src/utils/numeric-transformer.ts. Postgres 'numeric' возвращается строкой — превращаем в number.
const numericTransformer: ValueTransformer = {
    to: (value?: number | null) => value,
    from: (value?: string | null) =>
        value === null || value === undefined ? value : parseFloat(value),
};

export default numericTransformer;
