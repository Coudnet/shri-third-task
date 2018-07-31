import {HourClass} from './hour';

export class Shedule {
    constructor(rates, devices, maxPower) {
        if (!rates || !devices || !maxPower) throw new Error('Отсутсвуют входные данные. Проеверьте правильность написания json');
        this.createTimingLine(rates);
        this.checkDevices(devices);
    }

    /**
        Функция возвращает объект необходимого формата
     */

    makeExport() {
        let shedule = {};
        this.shedule.forEach((elem, ind) => {
            shedule[ind] = elem.ids;
        });
        return {
            'shedule': shedule,
            'consumedEnergy' : this.consumedEnergy
        }
    }

    /**
        Функция создает массив, где каждый элемент - это час дня, в который записан объект со значением
        тарифа в этот час и массив id приборов, которые работают в данное время.
        В конце проходи один цикл по всему массиву для проверки на незаполененные временные диапазоны
     */

    createTimingLine(rates) {
        this.shedule = Array(24);
        rates.forEach(rate => {
            if(!rate.from || !rate.to || !rate.value || rate.from < 0 || rate.to < 0 || rate.value < 0 || rate.from > 23 || rate.to > 23) {
                throw new Error('Неверные входные данные для тарифов. Отсутсвтуют необходимые поля');
            }

            let hour = new HourClass(rate.from);
            while(hour.value !== rate.to) {
                this.shedule[hour.value] = {
                    value: rate.value,
                    ids: []
                };
                hour.inc();
            }

            this.shedule.forEach(hour => {
                if(!hour) throw new Error('Неверные входные данные для тарифов. Отсутсвтует значение диапазона');
            })
        })
    }

    /**
        Алгоритм поиска.
        Алгоритм вычисляет промежуток, зависящий от параметра mode, в котором будет происходить поиск
        Определив промежуток, перебор всех последовательностей длины device.duration в этом проммежутке и запись
        последовательности с наименьшей общей стоимостью электропотребления

        В конце запись id во все элементы маccива this.shedule, попадающие в нужный промежуток

        Для перебора используется объект класса HourClass, использование которого облегчает перебор,
        при котором максимальное число - это 23. При инкременте .inc() проверяет, не вышло ли значение за 23, если да,
        то прееводит значение в 0. А в setVal(), проверка на устанавливаемое значение, которое может быть < 0 || > 23
     */

    checkDevices(devices) {

        this.consumedEnergy = {
            value: 0,
            devices: {}
        };

        devices.forEach(device => {
            // Проверка на корректность введенных данных
            if(!device.id || !device.name || !device.power || !device.duration) throw new Error('Отсутсвуют входные данные. Отсуттстыуют необходимые данные устройства');
            if(device.power < 0 || device.duration < 0) throw new Error('Неверные входные данные для устройств');
            if(!device.mode) device.mode = 'all';
            let power = device.power / 1000;

            // Выбор временного промежутка, в котором будет осуществляться поиск
            let firstPoint, lastPoint;

            switch(device.mode) {
                case 'day':
                    firstPoint = 7;
                    lastPoint = 20;
                    if(device.duration > 14) throw new Error('Неверные входные данные. Время работы усройства не соответсвтует его периоду дня');
                    break;
                case 'night':
                    firstPoint = 21;
                    lastPoint = 6;
                    if(device.duration > 10) throw new Error('Неверные входные данные. Время работы усройства не соответсвтует его периоду дня');
                    break;
                case 'all':
                    firstPoint = 0;
                    lastPoint = 23;
                    if(device.duration > 24) device.duration = 24;
            }

            // Установка начальных значений

            let i = new HourClass(firstPoint);
            let endi = new HourClass(lastPoint - (device.duration));
            let j = new HourClass(firstPoint);
            let endj = new HourClass(0);
            let min = {
                start: 0,
                value: Infinity
            };
            let cost = 0;

            // Поиск последовательности

            do {
                j.value = i.value;
                endj.setVal(i.value + (device.duration));

                if(device.duration === 24) {
                    for(let c = 0; c < 24; c++) {
                        cost += power * this.shedule[c].value;
                    }
                } else {
                    while (j.value !== endj.value) {
                        cost += power * this.shedule[j.value].value;
                        j.inc();
                    }
                }

                if(cost < min.value) {
                    min.value = cost;
                    min.start = i.value;
                }
                i.inc();

            } while(i.value !== endi.value);

            // Запись id в элементы массива this.shedule, которые попали в найденный промежуток
            i.setVal(min.start);
            endi.setVal(min.start + (device.duration));

            if(device.duration === 24) {
                for(let c = 0; c < 24; c++) {
                    this.shedule[c].ids.push(device.id);
                }
            } else {
                while(i.value !== endi.value) {
                    this.shedule[i.value].ids.push(device.id);
                    i.inc();
                }
            }

            this.consumedEnergy.value += min.value;
            this.consumedEnergy.devices[device.id] = min.value;
        })
    }
}