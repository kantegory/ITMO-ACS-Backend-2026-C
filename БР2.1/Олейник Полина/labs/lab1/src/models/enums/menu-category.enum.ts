// Категории блюд в меню ресторана — просто фиксированный список допустимых значений
// для поля category в таблице menu_item.
enum MenuCategory {
    APPETIZER = 'APPETIZER', // закуска
    MAIN_COURSE = 'MAIN_COURSE', // основное блюдо
    DESSERT = 'DESSERT', // десерт
    DRINK = 'DRINK', // напиток
}

export { MenuCategory };
