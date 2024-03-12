import API from '@/api/authenticated-api'
import { createGuestSession } from '@/api/thi-session-handler'
import { queryClient } from '@/components/provider'
import { USER_GUEST } from '@/hooks/contexts/userKind'
import { type PersDataDetails } from '@/types/thi-api'
import { router } from 'expo-router'

/**
 * Removes the quotation marks and the error code from the error message.
 * @param str The error message string to be trimmed.
 * @returns The trimmed error message string.
 */
export const trimErrorMsg = (str: string): string => {
    const match = str.match(/"([^"]*)"/)
    if (match !== null) {
        return match[1].trim()
    } else {
        return str
    }
}

export const performLogout = async (
    toggleUser: (user: undefined) => void,
    toggleAccentColor: (color: string) => void,
    resetDashboard: (userKind: string) => void
): Promise<void> => {
    try {
        toggleUser(undefined)
        toggleAccentColor('blue')
        resetDashboard(USER_GUEST)
        queryClient.clear()
        router.navigate('(tabs)')
        await createGuestSession()
    } catch (e) {
        console.log(e)
    }
}

export const networkError = 'Network request failed'
export const guestError = 'User is logged in as guest'
export const permissionError = '"Service for user-group not defined" (-120)'

/**
 * Checks if the error message is a known error.
 * @param error The error to be checked.
 * @returns True if the error is known, false otherwise.
 */
export const isKnownError = (error: Error | string): boolean => {
    const errorString = typeof error === 'string' ? error : error.message
    return (
        errorString === networkError ||
        errorString === guestError ||
        errorString === permissionError
    )
}

export async function getPersonalData(): Promise<PersDataDetails> {
    const response = await API.getPersonalData()
    const data: PersDataDetails = response.persdata
    data.pcounter = response.pcounter
    return data
}
