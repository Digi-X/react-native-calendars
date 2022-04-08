import { Component } from 'react';
declare type MarkedDate = {
    [key: string]: object;
};
interface Props {
    weekView?: boolean;
}
export default class ExpandableCalendarScreen extends Component<Props> {
    marked: MarkedDate;
    theme: {
        arrowColor: string;
        arrowStyle: {
            padding: number;
        };
        monthTextColor: string;
        textMonthFontSize: number;
        textMonthFontFamily: string;
        textMonthFontWeight: string;
        textSectionTitleColor: string;
        textDayHeaderFontSize: number;
        textDayHeaderFontFamily: string;
        textDayHeaderFontWeight: string;
        dayTextColor: string;
        textDayFontSize: number;
        textDayFontFamily: string;
        textDayFontWeight: string;
        textDayStyle: {
            marginTop: number;
        };
        selectedDayBackgroundColor: string;
        selectedDayTextColor: string;
        textDisabledColor: string;
        dotColor: string;
        selectedDotColor: string;
        disabledDotColor: string;
        dotStyle: {
            marginTop: number;
        };
    };
    todayBtnTheme: {
        todayButtonTextColor: string;
    };
    onDateChanged: () => void;
    onMonthChange: () => void;
    renderItem: ({ item }: any) => JSX.Element;
    render(): JSX.Element;
}
export {};
