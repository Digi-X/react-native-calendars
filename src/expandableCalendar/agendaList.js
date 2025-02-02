import get from 'lodash/get';
import map from 'lodash/map';
import isFunction from 'lodash/isFunction';
import isUndefined from 'lodash/isUndefined';
import PropTypes from 'prop-types';
import XDate from 'xdate';
import React, { useCallback, useContext, useEffect, useRef } from 'react';
import { Text, SectionList } from 'react-native';
import { isToday, isGTE, sameDate } from '../dateutils';
import { getMoment } from '../momentResolver';
import { parseDate } from '../interface';
import { getDefaultLocale } from '../services';
import { UpdateSources, todayString } from './commons';
import styleConstructor from './style';
import constants from '../commons/constants';
import Context from './Context';
const viewabilityConfig = {
    itemVisiblePercentThreshold: 20 // 50 means if 50% of the item is visible
};
/**
 * @description: AgendaList component
 * @note: Should be wrapped with 'CalendarProvider'
 * @extends: SectionList
 * @example: https://github.com/wix/react-native-calendars/blob/master/example/src/screens/expandableCalendar.js
 */
const AgendaList = (props) => {
    const { theme, sections, scrollToNextEvent, viewOffset = 0, avoidDateUpdates, onScroll, onMomentumScrollBegin, onMomentumScrollEnd, onScrollToIndexFailed, renderSectionHeader, sectionStyle, keyExtractor, dayFormatter, dayFormat = 'dddd, MMM d', useMoment, markToday = true } = props;
    const { date, updateSource, setDate, setDisabled } = useContext(Context);
    const style = useRef(styleConstructor(theme));
    const list = useRef();
    const _topSection = useRef(sections[0].title);
    const didScroll = useRef(false);
    const sectionScroll = useRef(false);
    const sectionHeight = useRef(0);
    useEffect(() => {
        if (date !== _topSection.current) {
            setTimeout(() => {
                scrollToSection();
            }, 500);
        }
    }, []);
    useEffect(() => {
        // NOTE: on first init data should set first section to the current date!!!
        if (updateSource !== UpdateSources.LIST_DRAG && updateSource !== UpdateSources.CALENDAR_INIT) {
            scrollToSection();
        }
    }, [date]);
    const getSectionIndex = (date) => {
        let i;
        map(sections, (section, index) => {
            // NOTE: sections titles should match current date format!!!
            if (section.title === date) {
                i = index;
            }
        });
        return i;
    };
    const getNextSectionIndex = (date) => {
        let i = 0;
        for (let j = 1; j < sections.length; j++) {
            const prev = parseDate(sections[j - 1].title);
            const next = parseDate(sections[j].title);
            const cur = parseDate(date);
            if (isGTE(cur, prev) && isGTE(next, cur)) {
                i = sameDate(prev, cur) ? j - 1 : j;
                break;
            }
            else if (isGTE(cur, next)) {
                i = j;
            }
        }
        return i;
    };
    const getSectionTitle = (title) => {
        if (!title)
            return;
        let sectionTitle = title;
        if (dayFormatter) {
            sectionTitle = dayFormatter(title);
        }
        else if (dayFormat) {
            if (useMoment) {
                const moment = getMoment();
                sectionTitle = moment(title).format(dayFormat);
            }
            else {
                sectionTitle = new XDate(title).toString(dayFormat);
            }
        }
        if (markToday) {
            const string = getDefaultLocale().today || todayString;
            const today = isToday(new XDate(title));
            sectionTitle = today ? `${string}, ${sectionTitle}` : sectionTitle;
        }
        return sectionTitle;
    };
    const scrollToSection = () => {
        const sectionIndex = scrollToNextEvent ? getNextSectionIndex(date) : getSectionIndex(date);
        if (isUndefined(sectionIndex)) {
            return;
        }
        if (list?.current && sectionIndex !== undefined) {
            sectionScroll.current = true; // to avoid setDate() in onViewableItemsChanged
            _topSection.current = sections[sectionIndex].title;
            list?.current.scrollToLocation({
                animated: true,
                sectionIndex: sectionIndex,
                itemIndex: 0,
                viewPosition: 0,
                viewOffset: (constants.isAndroid ? sectionHeight.current : 0) + viewOffset
            });
        }
    };
    const onViewableItemsChanged = useCallback((info) => {
        if (info?.viewableItems && !sectionScroll.current) {
            const topSection = get(info?.viewableItems[0], 'section.title');
            if (topSection && topSection !== _topSection.current) {
                _topSection.current = topSection;
                if (didScroll.current && !avoidDateUpdates) {
                    // to avoid setDate() on first load (while setting the initial context.date value)
                    setDate?.(_topSection.current, UpdateSources.LIST_DRAG);
                }
            }
        }
    }, [_topSection.current, didScroll.current, avoidDateUpdates, setDate]);
    const _onScroll = useCallback((event) => {
        if (!didScroll.current) {
            didScroll.current = true;
        }
        onScroll?.(event);
    }, [didScroll.current, onScroll]);
    const _onMomentumScrollBegin = useCallback((event) => {
        setDisabled?.(true);
        onMomentumScrollBegin?.(event);
    }, [onMomentumScrollBegin]);
    const _onMomentumScrollEnd = useCallback((event) => {
        // when list momentum ends AND when scrollToSection scroll ends
        sectionScroll.current = false;
        setDisabled?.(false);
        onMomentumScrollEnd?.(event);
    }, [onMomentumScrollEnd]);
    const _onScrollToIndexFailed = useCallback((info) => {
        if (onScrollToIndexFailed) {
            onScrollToIndexFailed(info);
        }
        else {
            console.log('onScrollToIndexFailed info: ', info);
        }
    }, [onScrollToIndexFailed]);
    const onHeaderLayout = useCallback((event) => {
        sectionHeight.current = event.nativeEvent.layout.height;
    }, []);
    const _renderSectionHeader = useCallback((info) => {
        const title = info?.section?.title;
        if (renderSectionHeader) {
            return renderSectionHeader(title);
        }
        return (<Text allowFontScaling={false} style={[style.current.sectionText, sectionStyle]} onLayout={onHeaderLayout}>
        {getSectionTitle(title)}
      </Text>);
    }, []);
    const _keyExtractor = useCallback((item, index) => {
        return isFunction(keyExtractor) ? keyExtractor(item, index) : String(index);
    }, [keyExtractor]);
    return (<SectionList {...props} ref={list} keyExtractor={_keyExtractor} showsVerticalScrollIndicator={false} onViewableItemsChanged={onViewableItemsChanged} viewabilityConfig={viewabilityConfig} renderSectionHeader={_renderSectionHeader} onScroll={_onScroll} onMomentumScrollBegin={_onMomentumScrollBegin} onMomentumScrollEnd={_onMomentumScrollEnd} onScrollToIndexFailed={_onScrollToIndexFailed}/>);
    // _getItemLayout = (data, index) => {
    //   return {length: constants.screenWidth, offset: constants.screenWidth * index, index};
    // }
};
export default AgendaList;
AgendaList.displayName = 'AgendaList';
AgendaList.propTypes = {
    // ...SectionList.propTypes,
    dayFormat: PropTypes.string,
    dayFormatter: PropTypes.func,
    useMoment: PropTypes.bool,
    markToday: PropTypes.bool,
    sectionStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.array]),
    avoidDateUpdates: PropTypes.bool
};
AgendaList.defaultProps = {
    dayFormat: 'dddd, MMM d',
    stickySectionHeadersEnabled: true,
    markToday: true
};
