// =====================================================================
// ПРОЕКТ: 1v9.gg (Маркетплейс игровых услуг)
// КТ3: Реализация принципов SOLID на TypeScript
// =====================================================================

// =====================================================================
// 1. S - Single Responsibility Principle (Принцип единственной ответственности)
// Каждый класс должен иметь только одну причину для изменения.
// =====================================================================

class Order {
    constructor(public readonly id: string, public readonly price: number) {}
}

// Класс ТОЛЬКО считает налоги (комиссию платформы)
class TaxCalculator {
    public calculateTax(order: Order): number {
        return order.price * 0.12; // 12% комиссия платформы
    }
}

// Класс ТОЛЬКО сохраняет данные в БД
class OrderRepository {
    public save(order: Order): void {
        console.log(`[БД] Заказ ${order.id} сохранен в PostgreSQL.`);
    }
}

// Класс ТОЛЬКО отправляет уведомления
class EmailNotifier {
    public sendEmail(email: string, message: string): void {
        console.log(`[Email] Отправлено на ${email}: ${message}`);
    }
}
// ❌ Если бы мы запихнули всё это в один класс Order, у него было бы 3 причины для изменения (налог, БД, email).
// ✅ Сейчас у каждого класса 1 причина.


// =====================================================================
// 2. O - Open/Closed Principle (Принцип открытости/закрытости)
// Классы должны быть открыты для расширения, но закрыты для изменения.
// =====================================================================

// Базовый интерфейс скидок
interface IDiscount {
    apply(price: number): number;
}

// Обычный пользователь (без скидки)
class StandardDiscount implements IDiscount {
    public apply(price: number): number { return price; }
}

// Скидка по реферальной ссылке (из КТ1)
class ReferralDiscount implements IDiscount {
    public apply(price: number): number { return price * 0.95; } // -5%
}

// Скидка на первый заказ
class FirstOrderDiscount implements IDiscount {
    public apply(price: number): number { return price * 0.90; } // -10%
}

// Класс оформления заказа ЗАКРЫТ для изменения (мы не трогаем его код),
// но ОТКРЫТ для расширения (мы можем добавить любой новый класс скидки).
class Checkout {
    public calculateFinalPrice(price: number, discount: IDiscount): number {
        return discount.apply(price);
    }
}


// =====================================================================
// 3. L - Liskov Substitution Principle (Принцип подстановки Барбары Лисков)
// Наследники должны корректно заменять родителя, не ломая программу.
// =====================================================================

abstract class PaymentMethod {
    public abstract pay(amount: number): void;
    public abstract refund(amount: number): void; // Важно: у всех платежек ДОЛЖЕН быть возврат!
}

class StripePayment extends PaymentMethod {
    public pay(amount: number): void {
        console.log(`[Stripe] Оплата картой на $${amount} прошла успешно.`);
    }
    public refund(amount: number): void {
        console.log(`[Stripe] Возврат $${amount} на карту.`);
    }
}

class CryptoPayment extends PaymentMethod {
    public pay(amount: number): void {
        console.log(`[Crypto] Оплата USDT на $${amount} прошла успешно.`);
    }
    public refund(amount: number): void {
        console.log(`[Crypto] Возврат $${amount} в криптовалюте.`);
    }
}
// ❌ Если бы мы сделали класс "ApplePayPayment" без реализации метода refund (кинув ошибку),
// это нарушило бы LSP, так как наследник сломал бы ожидания родителя.
// ✅ Здесь и Stripe, и Crypto корректно возвращают деньги.


// =====================================================================
// 4. I - Interface Segregation Principle (Принцип разделения интерфейсов)
// Клиенты не должны зависеть от интерфейсов, которые они не используют.
// =====================================================================

// Разделяем интерфейс на два маленьких
interface IWorking {
    work(): void;
}

interface IEating {
    eat(): void;
}

// Человек-бустер и работает, и ест
class Booster implements IWorking, IEating {
    public work(): void { console.log("[Бустер] Играет матчи и апает ранг."); }
    public eat(): void { console.log("[Бустер] Обедает."); }
}

// ИИ-бот (например, для автоматизации поддержки) — только работает, есть ему не нужно.
class SupportBot implements IWorking {
    public work(): void { console.log("[Бот] Отвечает на частые вопросы в чате."); }
}
// ❌ Если бы мы сделали один большой интерфейс IWorker с методами work() и eat(),
// классу SupportBot пришлось бы реализовывать eat() (например, с пустым телом), что нарушает ISP.
// ✅ Мы разделили их. Бот не зависит от лишнего метода.


// =====================================================================
// 5. D - Dependency Inversion Principle (Принцип инверсии зависимостей)
// Зависимости должны быть от абстракций (интерфейсов), а не от конкретных классов.
// =====================================================================

interface INotificationService {
    send(to: string, message: string): void;
}

class DiscordNotifier implements INotificationService {
    public send(to: string, message: string): void {
        console.log(`[Discord] Отправлено в канал ${to}: ${message}`);
    }
}

class TelegramNotifier implements INotificationService {
    public send(to: string, message: string): void {
        console.log(`[Telegram] Отправлено в чат ${to}: ${message}`);
    }
}

// Класс OrderManager зависит от ИНТЕРФЕЙСА (INotificationService), а не от Discord или Telegram напрямую.
class OrderManager {
    // Внедрение зависимости через конструктор (Dependency Injection)
    constructor(
        private notifier: INotificationService,
        private repo: OrderRepository
    ) {}

    public processOrder(order: Order): void {
        this.repo.save(order);
        this.notifier.send("admin_channel", `Новый заказ ${order.id} на сумму $${order.price}`);
    }
}


// =====================================================================
// ДЕМОНСТРАЦИЯ РАБОТЫ (ТЕСТИРОВАНИЕ)
// =====================================================================

function runSolidDemo() {
    console.log("=== ДЕМОНСТРАЦИЯ ПРИНЦИПОВ SOLID (1v9.gg) ===\n");

    // 1. SRP
    console.log("--- 1. SRP (Единственная ответственность) ---");
    const order = new Order("ORD-100", 50);
    const taxCalc = new TaxCalculator();
    const repo = new OrderRepository();
    const emailer = new EmailNotifier();
    
    console.log(`Налог: $${taxCalc.calculateTax(order)}`);
    repo.save(order);
    emailer.sendEmail("buyer@mail.com", "Ваш заказ создан");

    // 2. OCP
    console.log("\n--- 2. OCP (Открыт для расширения, закрыт для изменения) ---");
    const checkout = new Checkout();
    console.log(`Цена без скидки: $${checkout.calculateFinalPrice(50, new StandardDiscount())}`);
    console.log(`Цена по рефералке: $${checkout.calculateFinalPrice(50, new ReferralDiscount())}`);
    console.log(`Первый заказ: $${checkout.calculateFinalPrice(50, new FirstOrderDiscount())}`);

    // 3. LSP
    console.log("\n--- 3. LSP (Подстановка Барбары Лисков) ---");
    const payments: PaymentMethod[] = [new StripePayment(), new CryptoPayment()];
    payments.forEach(p => {
        p.pay(50);    // Обе платежки могут платить
        p.refund(50); // И обе могут возвращать (не ломают логику)
    });

    // 4. ISP
    console.log("\n--- 4. ISP (Разделение интерфейсов) ---");
    const booster = new Booster();
    const bot = new SupportBot();
    booster.work(); booster.eat();
    bot.work(); // Бот не вынужден реализовывать eat()

    // 5. DIP
    console.log("\n--- 5. DIP (Инверсия зависимостей) ---");
    // Менеджер заказов не знает, КУДА именно отправлять.
    // Сегодня мы даем ему Telegram, завтра (без изменения кода класса) — Discord.
    const managerWithTelegram = new OrderManager(new TelegramNotifier(), repo);
    managerWithTelegram.processOrder(order);

    const managerWithDiscord = new OrderManager(new DiscordNotifier(), repo);
    managerWithDiscord.processOrder(new Order("ORD-101", 100));
}

runSolidDemo();