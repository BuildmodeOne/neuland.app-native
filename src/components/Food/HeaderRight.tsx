import { router } from 'expo-router'
import type React from 'react'
import { useTranslation } from 'react-i18next'
import { Platform, Pressable, View } from 'react-native'
import { createStyleSheet, useStyles } from 'react-native-unistyles'

import PlatformIcon from '../Universal/Icon'

export const FoodHeaderRight = (): React.JSX.Element => {
	const { t } = useTranslation(['accessibility'])
	const { styles } = useStyles(stylesheet)
	return (
		<Pressable
			onPress={() => {
				router.navigate('/food-preferences')
			}}
			hitSlop={10}
			style={styles.headerButton}
			accessibilityLabel={t('button.foodPreferences')}
		>
			<View>
				<PlatformIcon
					ios={{
						name: 'line.3.horizontal.decrease',
						size: 22
					}}
					android={{
						name: 'filter_list',
						size: 24
					}}
					web={{
						name: 'ListFilter',
						size: 24
					}}
					style={styles.icon}
				/>
			</View>
		</Pressable>
	)
}

const stylesheet = createStyleSheet((theme) => ({
	headerButton: {
		marginHorizontal: Platform.OS !== 'ios' ? 14 : 0
	},
	icon: {
		color: theme.colors.text
	}
}))
