import ErrorView from '@/components/Elements/Error/ErrorView'
import { MealDay } from '@/components/Elements/Food'
import { AllergensBanner } from '@/components/Elements/Food/AllergensBanner'
import { FoodHeaderRight } from '@/components/Elements/Food/HeaderRight'
import { type Colors } from '@/components/colors'
import { FoodFilterContext } from '@/components/contexts'
import { useRefreshByUser } from '@/hooks'
import { type Food } from '@/types/neuland-api'
import { networkError } from '@/utils/api-utils'
import { loadFoodEntries } from '@/utils/food-utils'
import { PAGE_BOTTOM_SAFE_AREA } from '@/utils/style-utils'
import { pausedToast } from '@/utils/ui-utils'
import { useTheme } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { useNavigation } from 'expo-router'
import Head from 'expo-router/head'
import React, {
    useContext,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import PagerView from 'react-native-pager-view'

export function FoodScreen(): JSX.Element {
    const colors = useTheme().colors as Colors
    const [selectedDay, setSelectedDay] = useState<number>(0)
    const { selectedRestaurants, showStatic, allergenSelection } =
        useContext(FoodFilterContext)
    const [data, setData] = useState<Food[]>([])
    const { t, i18n } = useTranslation('common')
    const {
        data: foodData,
        error,
        isLoading,
        isError,
        isPaused,
        isSuccess,
        refetch,
    } = useQuery({
        queryKey: ['meals', selectedRestaurants, showStatic],
        queryFn: async () =>
            await loadFoodEntries(selectedRestaurants, showStatic),
        staleTime: 1000 * 60 * 0, // 10 minutes
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
    })
    const { isRefetchingByUser, refetchByUser } = useRefreshByUser(refetch)

    useEffect(() => {
        if (foodData == null) {
            return
        }
        const filteredDays = foodData
            .filter(
                (day) =>
                    new Date(day.timestamp).getTime() >=
                    new Date().setHours(0, 0, 0, 0)
            ) // filter again in case of yesterday's cached data
            .slice(0, 5)
        if (filteredDays.length === 0) {
            throw new Error('noMeals')
        }

        setData(filteredDays)
    }, [foodData])

    useEffect(() => {
        if (isPaused && data != null) {
            pausedToast()
        }
    }, [data, isPaused, t])

    const pagerViewRef = useRef<PagerView>(null)
    function setPage(page: number): void {
        pagerViewRef.current?.setPage(page)
    }

    /**
     * Renders a button for a specific day's food data.
     * @param {Food} day - The food data for the day.
     * @param {number} index - The index of the day in the list of days.
     * @returns {JSX.Element} - The rendered button component.
     */
    const DayButton = ({
        day,
        index,
    }: {
        day: Food
        index: number
    }): JSX.Element => {
        const date = new Date(day.timestamp)
        const { colors } = useTheme()

        const daysCnt = data != null ? (data.length < 5 ? data.length : 5) : 0
        const isFirstDay = index === 0
        const isLastDay = index === daysCnt - 1

        const buttonStyle = [
            { flex: 1, marginHorizontal: 4 },
            isFirstDay ? { marginLeft: 0 } : null,
            isLastDay ? { marginRight: 0 } : null,
        ]
        return (
            <View style={buttonStyle} key={index}>
                <Pressable
                    onPress={() => {
                        // only vibrate on iOS
                        if (Platform.OS === 'ios' && index !== selectedDay) {
                            void Haptics.selectionAsync()
                        }
                        setSelectedDay(index)
                        setPage(index)
                    }}
                >
                    <View
                        style={[
                            styles.dayButtonContainer,
                            {
                                backgroundColor: colors.card,
                                shadowColor: colors.text,
                            },
                        ]}
                    >
                        <Text
                            style={{
                                color:
                                    selectedDay === index
                                        ? colors.primary
                                        : colors.text,
                                ...(selectedDay === index
                                    ? styles.selectedDayText2
                                    : styles.normalDayText2),
                            }}
                            adjustsFontSizeToFit={true}
                            numberOfLines={1}
                        >
                            {date
                                .toLocaleDateString(i18n.language, {
                                    weekday: 'short',
                                })
                                .slice(0, 2)}
                        </Text>
                        <Text
                            style={{
                                color:
                                    selectedDay === index
                                        ? colors.primary
                                        : colors.text,
                                ...(selectedDay === index
                                    ? styles.selectedDayText
                                    : styles.normalDayText),
                            }}
                            adjustsFontSizeToFit={true}
                            numberOfLines={1}
                        >
                            {date.toLocaleDateString('de-DE', {
                                day: 'numeric',
                                month: 'numeric',
                            })}
                        </Text>
                    </View>
                </Pressable>
            </View>
        )
    }

    const screenHeight = Dimensions.get('window').height
    const scrollY = new Animated.Value(0)
    const showAllergensBanner =
        allergenSelection.length === 1 &&
        allergenSelection[0] === 'not-configured'

    return (
        <>
            <ScrollView
                refreshControl={
                    isError ? (
                        <RefreshControl
                            refreshing={isRefetchingByUser}
                            onRefresh={() => {
                                void refetchByUser()
                            }}
                        />
                    ) : undefined
                }
                style={{ ...styles.page, backgroundColor: colors.background }}
                contentInsetAdjustmentBehavior="always"
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
                scrollEnabled={!isLoading}
            >
                {isLoading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator
                            size="small"
                            color={colors.primary}
                        />
                    </View>
                )}
                {isError && (
                    <ErrorView
                        title={
                            error?.message === 'noMeals'
                                ? t('error.noMeals')
                                : error?.message ?? t('error.title')
                        }
                        onRefresh={refetchByUser}
                        refreshing={isRefetchingByUser}
                    />
                )}
                {isPaused && !isSuccess && (
                    <ErrorView
                        title={networkError}
                        onRefresh={refetchByUser}
                        refreshing={isRefetchingByUser}
                    />
                )}

                {isSuccess && data.length > 0 && (
                    <>
                        <Animated.View
                            // eslint-disable-next-line react-native/no-inline-styles
                            style={{
                                ...styles.animtedContainer,
                                borderBottomColor: colors.border,
                                borderBottomWidth: showAllergensBanner
                                    ? 0
                                    : scrollY.interpolate({
                                          inputRange: [0, 0, 0],
                                          outputRange: [0, 0, 0.5],
                                          extrapolate: 'clamp',
                                      }),
                            }}
                        >
                            <View
                                style={{
                                    ...styles.loadedContainer,
                                }}
                            >
                                {data
                                    .slice(0, 5)
                                    .map((day: Food, index: number) => (
                                        <DayButton
                                            day={day}
                                            index={index}
                                            key={index}
                                        />
                                    ))}
                            </View>
                        </Animated.View>
                        {showAllergensBanner && (
                            <AllergensBanner scrollY={scrollY} />
                        )}
                        <PagerView
                            ref={pagerViewRef}
                            style={{
                                ...styles.pagerContainer,
                                height: screenHeight,
                            }}
                            initialPage={0}
                            onPageSelected={(e) => {
                                const page = e.nativeEvent.position
                                setSelectedDay(page)
                            }}
                            scrollEnabled
                            overdrag
                        >
                            {data.map((_: any, index: number) => (
                                <ScrollView
                                    scrollEventThrottle={16}
                                    onScroll={Animated.event(
                                        [
                                            {
                                                nativeEvent: {
                                                    contentOffset: {
                                                        y: scrollY,
                                                    },
                                                },
                                            },
                                        ],
                                        { useNativeDriver: false }
                                    )}
                                    refreshControl={
                                        isSuccess ? (
                                            <RefreshControl
                                                refreshing={isRefetchingByUser}
                                                onRefresh={() => {
                                                    void refetchByUser()
                                                }}
                                            />
                                        ) : undefined
                                    }
                                    key={index}
                                    contentContainerStyle={
                                        styles.innerScrollContainer
                                    }
                                >
                                    <MealDay
                                        day={data[index]}
                                        index={index}
                                        colors={colors}
                                        key={index}
                                    />
                                </ScrollView>
                            ))}
                        </PagerView>
                    </>
                )}
            </ScrollView>
        </>
    )
}

export default function FoodRootScreen(): JSX.Element {
    const [isPageOpen, setIsPageOpen] = useState(false)
    const navigation = useNavigation()
    const { t } = useTranslation('navigation')
    useEffect(() => {
        setIsPageOpen(true)
    }, [])

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => <FoodHeaderRight />,
        })
    }, [navigation])

    return (
        <>
            <Head>
                {/* eslint-disable-next-line react-native/no-raw-text */}
                <title>{t('navigation.food')}</title>
                <meta name="Food" content="Meal plan for the canteens" />
                <meta property="expo:handoff" content="true" />
                <meta property="expo:spotlight" content="true" />
            </Head>
            {isPageOpen ? <FoodScreen /> : <></>}
        </>
    )
}

const styles = StyleSheet.create({
    page: {
        flex: 1,
    },
    pagerContainer: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    animtedContainer: {
        width: '100%',
    },
    loadedContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 10,
        marginHorizontal: 12,
    },
    loadingContainer: {
        paddingTop: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayButtonContainer: {
        width: '100%',
        height: 60,
        alignSelf: 'center',
        alignContent: 'center',
        borderRadius: 8,
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        alignItems: 'center',
        justifyContent: 'space-evenly',
        paddingVertical: 8,
    },
    innerScrollContainer: {
        marginHorizontal: 12,
        paddingBottom: PAGE_BOTTOM_SAFE_AREA,
    },
    selectedDayText: {
        fontSize: 16,
        fontWeight: '500',
    },
    normalDayText: {
        fontSize: 16,
        fontWeight: 'normal',
    },
    selectedDayText2: {
        fontSize: 15,
        fontWeight: '500',
    },
    normalDayText2: {
        fontSize: 15,
        fontWeight: 'normal',
    },
})