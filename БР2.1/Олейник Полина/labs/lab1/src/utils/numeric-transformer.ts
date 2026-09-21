import { ValueTransformer } from 'typeorm';

// Драйвер Postgres (pg) возвращает значения колонок типа numeric не как число,
// а как строку (например "1800.00" вместо 1800) — так сделано специально, чтобы
// не терять точность у очень больших чисел. Но нашему API нужны настоящие числа
// в JSON-ответах, а не строки.
//
// transformer подключается в модели вот так: @Column({ type: 'numeric', transformer: numericTransformer })
// TypeORM сам вызывает эти функции при каждом чтении/записи колонки:
const numericTransformer: ValueTransformer = {
    to: (value?: number | null) => value, // при записи в базу число не нужно менять — Postgres сам справится
    from: (value?: string | null) => // при чтении из базы превращаем строку в число
        value === null || value === undefined ? value : parseFloat(value),
};

export default numericTransformer;
