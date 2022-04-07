import PropTypes from 'prop-types';
import XDate from 'xdate';
import memoize from 'memoize-one';
import React, { Component } from 'react';
import { View } from 'react-native';
// @ts-expect-error
import GestureRecognizer, { swipeDirections } from 'react-native-swipe-gestures';
import { page, isGTE, isLTE, sameMonth } from '../dateutils';
import { xdateToData, parseDate, toMarkingFormat } from '../interface';
import { getState } from '../day-state-manager';
import { extractComponentProps } from '../componentUpdater';
// @ts-expect-error
import { WEEK_NUMBER } from '../testIDs';
import styleConstructor from './style';
import CalendarHeader from './header';
import Day from './day/index';
import BasicDay from './day/basic';
/**
 * @description: Calendar component
 * @example: https://github.com/wix/react-native-calendars/blob/master/example/src/screens/calendars.js
 * @gif: https://github.com/wix/react-native-calendars/blob/master/demo/assets/calendar.gif
 */
class Calendar extends Component {
    static displayName = 'Calendar';
    static propTypes = {
        ...CalendarHeader.propTypes,
        ...Day.propTypes,
        theme: PropTypes.object,
        firstDay: PropTypes.number,
        displayLoadingIndicator: PropTypes.bool,
        showWeekNumbers: PropTypes.bool,
        style: PropTypes.oneOfType([PropTypes.object, PropTypes.array, PropTypes.number]),
        current: PropTypes.string,
        initialDate: PropTypes.string,
        minDate: PropTypes.string,
        maxDate: PropTypes.string,
        markedDates: PropTypes.object,
        hideExtraDays: PropTypes.bool,
        showSixWeeks: PropTypes.bool,
        onDayPress: PropTypes.func,
        onDayLongPress: PropTypes.func,
        onMonthChange: PropTypes.func,
        onVisibleMonthsChange: PropTypes.func,
        disableMonthChange: PropTypes.bool,
        enableSwipeMonths: PropTypes.bool,
        disabledByDefault: PropTypes.bool,
        headerStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.array]),
        customHeader: PropTypes.any,
        allowSelectionOutOfRange: PropTypes.bool
    };
    static defaultProps = {
        enableSwipeMonths: false
    };
    state = {
        prevInitialDate: this.props.initialDate,
        currentMonth: this.props.current || this.props.initialDate ?
            parseDate(this.props.current || this.props.initialDate) : new XDate()
    };
    style = styleConstructor(this.props.theme);
    header = React.createRef();
    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps?.initialDate && nextProps?.initialDate !== prevState.prevInitialDate) {
            return {
                prevInitialDate: nextProps.initialDate,
                currentMonth: parseDate(nextProps.initialDate)
            };
        }
        return null;
    }
    addMonth = (count) => {
        this.updateMonth(this.state.currentMonth.clone().addMonths(count, true));
    };
    updateMonth = (day) => {
        if (sameMonth(day, this.state.currentMonth)) {
            return;
        }
        this.setState({ currentMonth: day.clone() }, () => {
            const currMont = this.state.currentMonth.clone();
            this.props.onMonthChange?.(xdateToData(currMont));
            this.props.onVisibleMonthsChange?.([xdateToData(currMont)]);
        });
    };
    handleDayInteraction(date, interaction) {
        const { disableMonthChange, allowSelectionOutOfRange } = this.props;
        const day = parseDate(date);
        const min = parseDate(this.props.minDate);
        const max = parseDate(this.props.maxDate);
        if (allowSelectionOutOfRange || !(min && !isGTE(day, min)) && !(max && !isLTE(day, max))) {
            const shouldUpdateMonth = disableMonthChange === undefined || !disableMonthChange;
            if (shouldUpdateMonth) {
                this.updateMonth(day);
            }
            if (interaction) {
                interaction(date);
            }
        }
    }
    pressDay = (date) => {
        if (date)
            this.handleDayInteraction(date, this.props.onDayPress);
    };
    longPressDay = (date) => {
        if (date)
            this.handleDayInteraction(date, this.props.onDayLongPress);
    };
    swipeProps = { onSwipe: (direction) => this.onSwipe(direction) };
    onSwipe = (gestureName) => {
        const { SWIPE_UP, SWIPE_DOWN, SWIPE_LEFT, SWIPE_RIGHT } = swipeDirections;
        switch (gestureName) {
            case SWIPE_UP:
            case SWIPE_DOWN:
                break;
            case SWIPE_LEFT:
                this.onSwipeLeft();
                break;
            case SWIPE_RIGHT:
                this.onSwipeRight();
                break;
        }
    };
    onSwipeLeft = () => {
        this.header?.current?.onPressRight();
    };
    onSwipeRight = () => {
        this.header?.current?.onPressLeft();
    };
    renderWeekNumber = memoize(weekNumber => {
        return (<View style={this.style.dayContainer} key={`week-container-${weekNumber}`}>
        <BasicDay key={`week-${weekNumber}`} marking={{ disabled: true, disableTouchEvent: true }} 
        // state='disabled'
        theme={this.props.theme} testID={`${WEEK_NUMBER}-${weekNumber}`}>
          {weekNumber}
        </BasicDay>
      </View>);
    });
    renderDay(day, id) {
        const { hideExtraDays, markedDates } = this.props;
        const dayProps = extractComponentProps(Day, this.props);
        if (!sameMonth(day, this.state.currentMonth) && hideExtraDays) {
            return <View key={id} style={this.style.emptyDayContainer}/>;
        }
        return (<View style={this.style.dayContainer} key={id}>
        <Day {...dayProps} date={toMarkingFormat(day)} state={getState(day, this.state.currentMonth, this.props)} marking={markedDates?.[toMarkingFormat(day)]} onPress={this.pressDay} onLongPress={this.longPressDay}/>
      </View>);
    }
    renderWeek(days, id) {
        const week = [];
        days.forEach((day, id2) => {
            week.push(this.renderDay(day, id2));
        }, this);
        if (this.props.showWeekNumbers) {
            week.unshift(this.renderWeekNumber(days[days.length - 1].getWeek()));
        }
        return (<View style={this.style.week} key={id}>
        {week}
      </View>);
    }
    renderMonth() {
        const { currentMonth } = this.state;
        const { firstDay, showSixWeeks, hideExtraDays } = this.props;
        const shouldShowSixWeeks = showSixWeeks && !hideExtraDays;
        const days = page(currentMonth, firstDay, shouldShowSixWeeks);
        const weeks = [];
        while (days.length) {
            weeks.push(this.renderWeek(days.splice(0, 7), weeks.length));
        }
        return <View style={this.style.monthView}>{weeks}</View>;
    }
    renderHeader() {
        const { customHeader, headerStyle, displayLoadingIndicator, markedDates, testID } = this.props;
        let indicator;
        if (this.state.currentMonth) {
            const lastMonthOfDay = toMarkingFormat(this.state.currentMonth.clone().addMonths(1, true).setDate(1).addDays(-1));
            if (displayLoadingIndicator && !markedDates?.[lastMonthOfDay]) {
                indicator = true;
            }
        }
        const headerProps = extractComponentProps(CalendarHeader, this.props);
        const CustomHeader = customHeader;
        const HeaderComponent = customHeader ? CustomHeader : CalendarHeader;
        const ref = customHeader ? undefined : this.header;
        return (<HeaderComponent {...headerProps} testID={testID} style={headerStyle} ref={ref} month={this.state.currentMonth} addMonth={this.addMonth} displayLoadingIndicator={indicator}/>);
    }
    render() {
        const { enableSwipeMonths, style } = this.props;
        const GestureComponent = enableSwipeMonths ? GestureRecognizer : View;
        const gestureProps = enableSwipeMonths ? this.swipeProps : undefined;
        return (<GestureComponent {...gestureProps}>
        <View style={[this.style.container, style]} accessibilityElementsHidden={this.props.accessibilityElementsHidden} // iOS
         importantForAccessibility={this.props.importantForAccessibility} // Android
        >
          {this.renderHeader()}
          {this.renderMonth()}
        </View>
      </GestureComponent>);
    }
}
export default Calendar;
