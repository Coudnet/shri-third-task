/**
 * Класс для перебора значений в диапазоне 0-23
 * для автоматического обнуления при достижении значения 24
 * И рассчета нужного значения при входных данных > 23 || < 0
 */
export class HourClass {
    constructor(num) {
        this.setVal(num);
    }
    inc() {
        if ((this.value + 1) === 24) this.value = 0;
        else this.value++;
    }
    setVal(num) {
        if(num > 23) this.value = num - 24;
        else if(num < 0) this.value = 24 + num;
        else this.value = num;
    }
}