import { Repository, ObjectLiteral } from 'typeorm';

// Базовый класс для всех контроллеров, которые работают с какой-то одной таблицей.
// Сам по себе он ничего не делает — просто объявляет, что у наследника БУДЕТ поле
// repository (через него контроллер читает/пишет в базу: this.repository.find(), .save() и т.д.).
// Настоящее значение в это поле подставляет декоратор @EntityController
// (см. entity-controller.ts) — он "магически" создаёт геттер для repository.
class BaseController {
    repository!: Repository<ObjectLiteral>; // "!" говорит TypeScript: "не проверяй, что поле проинициализировано в конструкторе — оно появится позже"
}

export default BaseController;
