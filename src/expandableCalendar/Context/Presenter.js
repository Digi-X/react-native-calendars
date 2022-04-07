import XDate from 'xdate';
import { sameMonth, isToday, isPastDate } from '../../dateutils';
import { xdateToData, toMarkingFormat } from '../../interface';
import { getDefaultLocale } from '../../services';
const commons = require('../commons');
const TOP_POSITION = 65;
class Presenter {
    _getIconDown = () => {
        return require('../../img/down.png');
    };
    _getIconUp = () => {
        return require('../../img/up.png');
    };
    getButtonIcon = (date, showTodayButton = true) => {
        if (!showTodayButton) {
            return undefined;
        }
        const icon = isPastDate(date) ? this._getIconDown() : this._getIconUp();
        return icon;
    };
    setDate = (props, date, newDate, updateState, updateSource) => {
        const buttonIcon = this.getButtonIcon(date, props.showTodayButton);
        updateState(buttonIcon);
        props.onDateChanged?.(date, updateSource);
        if (!sameMonth(new XDate(date), new XDate(newDate))) {
            props.onMonthChange?.(xdateToData(new XDate(date)), updateSource);
        }
    };
    setDisabled = (showTodayButton, newDisabledValue, oldDisabledValue, updateState) => {
        if (!showTodayButton || newDisabledValue === oldDisabledValue) {
            return;
        }
        updateState(newDisabledValue);
    };
    shouldAnimateTodayButton = (props) => {
        return props.showTodayButton;
    };
    getTodayDate = () => {
        return toMarkingFormat(new XDate());
    };
    getPositionAnimation = (date, todayBottomMargin = 0) => {
        const toValue = isToday(new XDate(date)) ? TOP_POSITION : -todayBottomMargin || -TOP_POSITION;
        return {
            toValue,
            tension: 30,
            friction: 8,
            useNativeDriver: true
        };
    };
    shouldAnimateOpacity = (props) => {
        return props.disabledOpacity;
    };
    getOpacityAnimation = ({ disabledOpacity = 0 }, disabled) => {
        return {
            toValue: disabled ? disabledOpacity : 1,
            duration: 500,
            useNativeDriver: true
        };
    };
    getTodayFormatted = () => {
        const todayString = getDefaultLocale().today || commons.todayString;
        const today = todayString.charAt(0).toUpperCase() + todayString.slice(1);
        return today;
    };
}
export default Presenter;
