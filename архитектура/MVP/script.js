document.addEventListener('DOMContentLoaded', () => {
    const firstCard = document.querySelector('.card');
    
    // Добавляем интерактивность: через 2 секунды выделим первую карточку
    setTimeout(() => {
        // Добавление модификатора через JS строго по БЭМ
        firstCard.classList.add('card_hovered');
        console.log('[БЭМ] Добавлен класс-модификатор: card_hovered');
    }, 2000);
});