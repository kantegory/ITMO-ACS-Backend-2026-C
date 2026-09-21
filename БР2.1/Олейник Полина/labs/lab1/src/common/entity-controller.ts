import { EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import { JsonController } from 'routing-controllers';
import { ControllerOptions } from 'routing-controllers/types/decorator-options/ControllerOptions';

import dataSource from '../config/data-source';

// Интерфейс для опций нашего декоратора
interface EntityControllerOptions {
    baseRoute?: string; // общий префикс маршрутов класса, например '/cities'. Можно не задавать —
    // тогда в каждом методе контроллера нужно писать полный путь (так сделано в review.controller.ts)
    controllerOptions?: ControllerOptions;
    entity?: EntityTarget<ObjectLiteral>; // модель (Entity), с которой работает контроллер, например City
}

// Интерфейс для классов, использующих декоратор
export interface WithRepository {
    repository: Repository<ObjectLiteral>;
}

// Тип для конструктора класса
type Constructor = {
    new (...args: any[]): any;
};

// Свой декоратор-обёртка поверх стандартного @JsonController из routing-controllers.
// Делает две вещи разом:
// 1) превращает класс в контроллер (регистрирует его маршруты через JsonController);
// 2) если передана entity — добавляет классу поле repository, через которое
//    контроллер обращается к таблице этой модели (this.repository.find(), .save() и т.п.),
//    не нужно самому писать dataSource.getRepository(...) в каждом контроллере.
function EntityController(options: EntityControllerOptions = {}) {
    const { baseRoute, controllerOptions, entity } = options;

    return function (target: Constructor): Constructor {
        // Применяем стандартный декоратор JsonController из routing-controllers
        JsonController(baseRoute, controllerOptions)(target);

        // Если указан entity, добавляем repository как свойство класса
        if (entity) {
            Object.defineProperty(target.prototype, 'repository', {
                get(): Repository<ObjectLiteral> {
                    // получаем репозиторий заново при каждом обращении —
                    // это дёшево и гарантирует, что база данных уже подключена
                    return dataSource.getRepository(entity);
                },
                configurable: true,
            });
        }

        return target as Constructor;
    };
}

export default EntityController;
