// =====================================================================
// ПРОЕКТ: 1v9.gg (Маркетплейс игровых услуг)
// КТ2: Реализация принципов ООП на TypeScript
// =====================================================================

// ---------------------------------------------------------------------
// 1. АБСТРАКЦИЯ И ИНКАПСУЛЯЦИЯ (Базовый класс Пользователя)
// ---------------------------------------------------------------------

abstract class User {
    // Инкапсуляция: поля защищены (protected), прямой доступ извне закрыт
    protected readonly id: string;
    protected email: string;
    protected balance: number;

    constructor(id: string, email: string, initialBalance: number = 0) {
        this.id = id;
        this.email = email;
        this.balance = initialBalance;
    }

    // Абстракция: каждый наследник обязан сказать, кто он по роли
    public abstract getRole(): string;

    // Инкапсуляция: доступ к балансу только на чтение
    public getBalance(): number {
        return this.balance;
    }

    // Инкапсуляция: изменение баланса только через защищенный метод
    protected updateBalance(amount: number): void {
        const newBalance = this.balance + amount;
        if (newBalance < 0) {
            throw new Error("Ошибка: Баланс не может быть отрицательным");
        }
        this.balance = newBalance;
    }
}

// ---------------------------------------------------------------------
// 2. НАСЛЕДОВАНИЕ (Покупатель и Бустер)
// ---------------------------------------------------------------------

class Buyer extends User {
    private orders: Order[] = [];

    public getRole(): string {
        return "Покупатель";
    }

    public addOrder(order: Order): void {
        this.orders.push(order);
    }

    public pay(amount: number): void {
        // Вызов защищенного метода родителя
        this.updateBalance(-amount);
        console.log(`[Баланс] ${this.email} списал $${amount}. Остаток: $${this.getBalance()}`);
    }
}

class Booster extends User {
    private completedOrders: number = 0;

    public getRole(): string {
        return "Бустер (Исполнитель)";
    }

    public receivePayment(amount: number): void {
        this.updateBalance(amount);
        this.completedOrders++;
        console.log(`[Баланс] ${this.email} получил $${amount}. Остаток: $${this.getBalance()}`);
    }
}

// ---------------------------------------------------------------------
// 3. ИНКАПСУЛЯЦИЯ (Класс Эскроу - TradeShield)
// ---------------------------------------------------------------------

class EscrowAccount {
    private readonly orderId: string;
    private readonly amount: number;
    // Статус скрыт от внешнего мира
    private status: 'held' | 'released' | 'refunded' = 'held';

    constructor(orderId: string, amount: number) {
        this.orderId = orderId;
        this.amount = amount;
        console.log(`[Эскроу] Создан счет для заказа ${orderId}. Сумма: $${amount}. Статус: УДЕРЖАНО (held).`);
    }

    public release(): void {
        if (this.status !== 'held') {
            throw new Error("Ошибка: Средства уже выплачены или возвращены");
        }
        this.status = 'released';
        console.log(`[Эскроу] Средства по заказу ${this.orderId} разморожены и переведены исполнителю.`);
    }

    public refund(): void {
        if (this.status !== 'held') {
            throw new Error("Ошибка: Средства уже выплачены или возвращены");
        }
        this.status = 'refunded';
        console.log(`[Эскроу] Средства по заказу ${this.orderId} возвращены покупателю (Store Credit).`);
    }
}

// ---------------------------------------------------------------------
// 4. ПОЛИМОРФИЗМ (Типы услуг)
// ---------------------------------------------------------------------

abstract class Service {
    protected basePrice: number;
    
    constructor(basePrice: number) {
        this.basePrice = basePrice;
    }

    // Полиморфный метод: у каждой услуги своя формула расчета
    public abstract calculateTotalPrice(): number;
    public abstract getDescription(): string;
}

class BoostingService extends Service {
    constructor(basePrice: number, private rankDifference: number) {
        super(basePrice);
    }
    
    public calculateTotalPrice(): number {
        return this.basePrice * this.rankDifference;
    }

    public getDescription(): string {
        return `Бустинг (разница рангов: ${this.rankDifference})`;
    }
}

class AccountPurchaseService extends Service {
    public calculateTotalPrice(): number {
        // Цена аккаунта + 5% страховка TradeShield
        const insurance = this.basePrice * 0.05;
        return this.basePrice + insurance;
    }

    public getDescription(): string {
        return `Покупка аккаунта (со страховкой TradeShield)`;
    }
}

class CoachingService extends Service {
    constructor(basePrice: number, private hours: number) {
        super(basePrice);
    }
    
    public calculateTotalPrice(): number {
        return this.basePrice * this.hours;
    }

    public getDescription(): string {
        return `Коучинг (часов: ${this.hours})`;
    }
}

// ---------------------------------------------------------------------
// 5. СВЯЗЫВАНИЕ (Класс Заказа)
// ---------------------------------------------------------------------

class Order {
    private escrow: EscrowAccount | null = null;
    private isCompleted: boolean = false;

    constructor(
        public readonly id: string,
        public readonly buyer: Buyer,
        public readonly service: Service
    ) {}

    public checkout(): void {
        if (this.escrow) {
            throw new Error("Заказ уже был оплачен");
        }

        const totalPrice = this.service.calculateTotalPrice();
        console.log(`\n--- Оформление заказа ${this.id} ---`);
        console.log(`Услуга: ${this.service.getDescription()}`);
        console.log(`Итоговая стоимость: $${totalPrice}`);

        // Списание средств с покупателя
        this.buyer.pay(totalPrice);
        
        // Заморозка средств в эскроу
        this.escrow = new EscrowAccount(this.id, totalPrice);
        this.buyer.addOrder(this);
    }

    public completeOrder(booster: Booster): void {
        if (!this.escrow) throw new Error("Заказ не был оплачен");
        if (this.isCompleted) throw new Error("Заказ уже завершен");

        console.log(`\n--- Завершение заказа ${this.id} ---`);
        // Логика: бустер выполнил работу, эскроу размораживает деньги
        this.escrow.release();
        booster.receivePayment(this.service.calculateTotalPrice());
        this.isCompleted = true;
    }

    public cancelOrder(): void {
        if (!this.escrow) throw new Error("Заказ не был оплачен");
        if (this.isCompleted) throw new Error("Нельзя отменить завершенный заказ");

        console.log(`\n--- Отмена заказа ${this.id} ---`);
        this.escrow.refund();
        // В реальной системе здесь был бы возврат на баланс (store credit)
    }
}

// ---------------------------------------------------------------------
// 6. ДЕМОНСТРАЦИЯ РАБОТЫ (ТЕСТИРОВАНИЕ)
// ---------------------------------------------------------------------

function runDemo() {
    console.log("=== СИСТЕМА 1v9.gg ЗАПУЩЕНА ===");

    // 1. Создаем участников
    const buyer = new Buyer("U1", "alex@mail.com", 100); // У Алекса есть $100
    const booster = new Booster("U2", "danil@mail.com", 0);

    // 2. Сценарий А: Покупка бустинга
    console.log("\n[Сценарий 1: Алексей покупает бустинг]");
    const boostService = new BoostingService(15, 3); // $15 за ранг, разница 3
    const order1 = new Order("ORD-001", buyer, boostService);
    
    order1.checkout();       // Оплата (списание + эскроу)
    order1.completeOrder(booster); // Бустер выполнил, получает деньги

    // 3. Сценарий Б: Покупка аккаунта (полиморфизм)
    console.log("\n[Сценарий 2: Мария покупает аккаунт]");
    const buyer2 = new Buyer("U3", "maria@mail.com", 50);
    const accountService = new AccountPurchaseService(40); // Аккаунт за $40 + 5% страховка
    const order2 = new Order("ORD-002", buyer2, accountService);
    
    order2.checkout();

    // 4. Сценарий В: Отмена (возврат через эскроу)
    console.log("\n[Сценарий 3: Отмена заказа и возврат средств]");
    order2.cancelOrder();

    // 5. Проверка ошибок (Инкапсуляция)
    console.log("\n[Сценарий 4: Проверка защиты данных]");
    try {
        // Попытка купить услугу, на которую не хватает денег
        const expensiveService = new CoachingService(50, 2); // $100
        const order3 = new Order("ORD-003", buyer2, expensiveService);
        order3.checkout(); // Ошибка: у Марии осталось только $10 (после возврата)
    } catch (e: any) {
        console.log(`[Перехвачена ошибка]: ${e.message}`);
    }
}

// Запуск
runDemo();



