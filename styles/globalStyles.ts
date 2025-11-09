import styled from "styled-components/native";

// Color palette
export const colors = {
  // Primary colors
  primary: "#007AFF",
  secondary: "#fab905",

  // Status colors
  success: "#4caf50",
  danger: "#ff4336",
  warning: "#ffa500",
  info: "#0e7bff",

  // Neutral colors
  white: "#ffffff",
  light: "#f0f0f0",
  lightGray: "#f8f9fa",
  gray: "#666666",
  darkGray: "#333333",
  border: "#ccc",

  // Background colors
  background: "#f0f0f0",
  cardBackground: "#ffffff",
  modalOverlay: "rgba(0, 0, 0, 0.5)",

  // Text colors
  textPrimary: "#333333",
  textSecondary: "#666666",
  textLight: "#ffffff",

  // Calendar colors
  calendarToday: "#E3F2FD",
  calendarSelected: "#007AFF",

  // Attendance colors
  attendancePresent: "#b6eab6",
  attendanceJustified: "#b3eaff",
  attendanceAbsent: "#f7b6b6",
  attendanceNotSet: "#e0e0e0",
};

// Common spacing and sizing
export const spacing = {
  xs: 5,
  sm: 10,
  md: 15,
  lg: 20,
  xl: 30,
};

export const borderRadius = {
  sm: 5,
  md: 8,
  lg: 10,
  xl: 20,
  round: 25,
};

export const shadow = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  large: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
};

// Base Components
export const Container = styled.View`
  flex: 1;
  padding: ${spacing.lg}px;
  background-color: ${colors.background};
`;

export const Card = styled.View`
  background-color: ${colors.cardBackground};
  border-radius: ${borderRadius.lg}px;
  padding: ${spacing.md}px;
  margin-bottom: ${spacing.md}px;
  shadow-color: ${shadow.medium.shadowColor};
  shadow-offset: ${shadow.medium.shadowOffset.width}px
    ${shadow.medium.shadowOffset.height}px;
  shadow-opacity: ${shadow.medium.shadowOpacity};
  shadow-radius: ${shadow.medium.shadowRadius}px;
  elevation: ${shadow.medium.elevation};
`;

export const Row = styled.View`
  flex-direction: row;
  align-items: center;
`;

export const SpaceBetween = styled(Row)`
  justify-content: space-between;
`;

export const Center = styled.View`
  align-items: center;
  justify-content: center;
`;

// Typography
export const Heading = styled.Text`
  font-size: 18px;
  font-weight: bold;
  margin-vertical: ${spacing.sm}px;
  text-align: center;
  color: ${colors.textPrimary};
`;

export const Title = styled.Text`
  font-size: 20px;
  font-weight: bold;
  margin-bottom: ${spacing.sm}px;
  color: ${colors.textPrimary};
`;

export const Subtitle = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: ${colors.textPrimary};
  margin-bottom: ${spacing.sm}px;
`;

export const BodyText = styled.Text`
  font-size: 14px;
  color: ${colors.textSecondary};
`;

export const Label = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: ${colors.textPrimary};
  margin-bottom: ${spacing.sm}px;
`;

// Input Components
export const Input = styled.TextInput`
  border-width: 1px;
  border-color: ${colors.border};
  border-radius: ${borderRadius.sm}px;
  padding: ${spacing.sm}px;
  margin-bottom: ${spacing.sm}px;
  background-color: ${colors.white};
  font-size: 16px;
  text-align: left;
  width: 100%;
`;

export const InputRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
  margin-bottom: ${spacing.md}px;
`;

export const InputHalf = styled(Input)`
  width: 48%;
  margin-bottom: 0;
  text-align: left;
`;

export const InputThird = styled(Input)`
  width: 30%;
  margin-bottom: 0;
  text-align: left;
`;

export const InputWide = styled(Input)`
  width: 48%;
  margin-bottom: 0;
  text-align: left;
`;

export const InputNarrow = styled(Input)`
  width: 16%;
  margin-bottom: 0;
  text-align: left;
`;

export const InputMedium = styled(Input)`
  width: 32%;
  margin-bottom: 0;
  text-align: left;
`;

// Button Components
export const BaseButton = styled.TouchableOpacity`
  padding-vertical: ${spacing.xs}px;
  padding-horizontal: ${spacing.sm}px;
  border-radius: ${borderRadius.sm}px;
  align-items: center;
  justify-content: center;
`;

export const PrimaryButton = styled(BaseButton)`
  background-color: ${colors.primary};
`;

export const SecondaryButton = styled(BaseButton)`
  background-color: ${colors.secondary};
`;

export const SuccessButton = styled(BaseButton)`
  background-color: ${colors.success};
`;

export const DangerButton = styled(BaseButton)`
  background-color: ${colors.danger};
`;

export const WarningButton = styled(BaseButton)`
  background-color: ${colors.warning};
`;

export const InfoButton = styled(BaseButton)`
  background-color: ${colors.info};
`;

export const ButtonText = styled.Text`
  color: ${colors.textLight};
  font-weight: bold;
  font-size: 16px;
`;

export const IconButton = styled.TouchableOpacity`
  padding: ${spacing.xs}px;
  border-radius: ${borderRadius.sm}px;
  justify-content: center;
  align-items: center;
`;

export const EditButton = styled(IconButton)`
  background-color: ${colors.info};
  margin-top: ${spacing.xs}px;
`;

export const DeleteButton = styled(IconButton)`
  background-color: ${colors.danger};
  margin-top: ${spacing.xs}px;
`;

export const AttendanceButton = styled(IconButton)`
  background-color: ${colors.warning};
`;

// Modal Components
export const ModalContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: ${colors.modalOverlay};
`;

export const ModalContent = styled.View`
  width: 300px;
  padding: ${spacing.lg}px;
  background-color: ${colors.white};
  border-radius: ${borderRadius.lg}px;
  shadow-color: ${shadow.large.shadowColor};
  shadow-offset: ${shadow.large.shadowOffset.width}px
    ${shadow.large.shadowOffset.height}px;
  shadow-opacity: ${shadow.large.shadowOpacity};
  shadow-radius: ${shadow.large.shadowRadius}px;
  align-items: center;
  justify-content: center;
`;

export const ModalHeader = styled.View`
  align-items: center;
  margin-bottom: ${spacing.xl}px;
  padding-bottom: ${spacing.lg}px;
  border-bottom-width: 1px;
  border-bottom-color: ${colors.lightGray};
  width: 100%;
`;

export const ModalTitle = styled(Title)`
  text-align: center;
`;

export const ModalButtons = styled(Row)`
  justify-content: space-between;
  width: 100%;
  margin-top: ${spacing.md}px;
`;

// Calendar Components
export const CalendarContainer = styled(Card)`
  margin-bottom: ${spacing.lg}px;
`;

export const WeekNavigation = styled(SpaceBetween)`
  margin-bottom: ${spacing.md}px;
`;

export const NavButton = styled.TouchableOpacity`
  padding: ${spacing.sm}px;
  border-radius: ${borderRadius.xl}px;
  background-color: ${colors.lightGray};
`;

export const WeekTitle = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: ${colors.textPrimary};
`;

export const WeekDaysContainer = styled(Row)`
  justify-content: space-between;
`;

export const DayContainer = styled(Center)`
  flex: 1;
`;

export const DayLabel = styled.Text`
  font-size: 12px;
  color: ${colors.textSecondary};
  margin-bottom: 8px;
  font-weight: 500;
`;

export const DayButton = styled.TouchableOpacity<{
  isSelected?: boolean;
  isToday?: boolean;
}>`
  width: 40px;
  height: 40px;
  border-radius: ${borderRadius.xl}px;
  justify-content: center;
  align-items: center;
  background-color: ${(props: { isSelected?: boolean; isToday?: boolean }) =>
    props.isSelected
      ? colors.calendarSelected
      : props.isToday
      ? colors.calendarToday
      : "transparent"};
  border: ${(props: { isSelected?: boolean; isToday?: boolean }) =>
    props.isToday && !props.isSelected
      ? `2px solid ${colors.calendarSelected}`
      : "none"};
`;

export const DayText = styled.Text<{ isSelected?: boolean; isToday?: boolean }>`
  font-size: 16px;
  font-weight: ${(props: { isSelected?: boolean; isToday?: boolean }) =>
    props.isToday || props.isSelected ? "bold" : "normal"};
  color: ${(props: { isSelected?: boolean; isToday?: boolean }) =>
    props.isSelected
      ? colors.textLight
      : props.isToday
      ? colors.calendarSelected
      : colors.textPrimary};
`;

// List Components
export const ListItem = styled.View`
  padding: ${spacing.sm}px;
  background-color: ${colors.cardBackground};
  margin-bottom: ${spacing.xs}px;
  border-radius: ${borderRadius.sm}px;
  shadow-color: ${shadow.medium.shadowColor};
  shadow-offset: ${shadow.medium.shadowOffset.width}px
    ${shadow.medium.shadowOffset.height}px;
  shadow-opacity: ${shadow.medium.shadowOpacity};
  shadow-radius: ${shadow.medium.shadowRadius}px;
`;

export const EmptyState = styled(Center)`
  margin-top: ${spacing.lg}px;
`;

// Filter Components
export const FilterContainer = styled(Card)`
  margin-bottom: ${spacing.md}px;
`;

export const FilterLabel = styled(Label)`
  margin-bottom: ${spacing.sm}px;
`;

// Portrait Components
export const Portrait = styled.Image`
  width: 50px;
  height: 50px;
  border-radius: ${borderRadius.round}px;
  margin-right: ${spacing.sm}px;
`;

export const ModalPortrait = styled.Image`
  width: 120px;
  height: 120px;
  border-radius: 60px;
  margin-bottom: ${spacing.md}px;
  border-width: 3px;
  border-color: ${colors.white};
  shadow-color: ${shadow.large.shadowColor};
  shadow-offset: ${shadow.large.shadowOffset.width}px
    ${shadow.large.shadowOffset.height}px;
  shadow-opacity: ${shadow.large.shadowOpacity};
  shadow-radius: ${shadow.large.shadowRadius}px;
  elevation: ${shadow.large.elevation};
`;

// Athlete Row Components
export const AthleteRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${spacing.sm}px;
  padding: ${spacing.sm}px;
  border-width: 1px;
  border-color: ${colors.border};
  border-radius: ${borderRadius.sm}px;
  background-color: ${colors.lightGray};
`;

// Counter Components (for attendance)
export const CounterContainer = styled(Row)`
  justify-content: space-around;
  margin-bottom: ${spacing.md}px;
  padding-horizontal: ${spacing.sm}px;
`;

export const CounterItem = styled(Center)`
  padding-vertical: 6px;
  padding-horizontal: 12px;
  border-radius: 6px;
  min-width: 50px;
  shadow-color: ${shadow.small.shadowColor};
  shadow-offset: ${shadow.small.shadowOffset.width}px
    ${shadow.small.shadowOffset.height}px;
  shadow-opacity: ${shadow.small.shadowOpacity};
  shadow-radius: ${shadow.small.shadowRadius}px;
  elevation: ${shadow.small.elevation};
`;

export const CounterText = styled.Text`
  font-size: 14px;
  font-weight: bold;
  color: ${colors.textPrimary};
`;

// Active Checkbox Components
export const ActiveContainer = styled.View`
  flex-direction: row;
  align-items: center;
  width: 100%;
  justify-content: flex-start;
`;

export const ActiveLabel = styled.Text`
  font-size: 16px;
  margin-right: ${spacing.sm}px;
  color: ${colors.textPrimary};
  font-weight: 500;
`;

export const ActiveCheckbox = styled.TouchableOpacity`
  margin-left: ${spacing.sm}px;
  flex-direction: row;
  align-items: center;
`;

export const Checkbox = styled.View`
  width: 24px;
  height: 24px;
  border-width: 2px;
  border-color: ${colors.primary};
  justify-content: center;
  align-items: center;
  border-radius: 4px;
`;

export const CheckmarkText = styled.Text`
  color: ${colors.textLight};
  font-weight: bold;
  font-size: 14px;
`;

// Attendance Screen Specific Components
export const AthleteName = styled.Text`
  font-weight: bold;
  font-size: 16px;
  color: ${colors.textPrimary};
`;

export const AthleteRowPresent = styled(AthleteRow)`
  background-color: ${colors.attendancePresent};
`;

export const AthleteRowJustified = styled(AthleteRow)`
  background-color: ${colors.attendanceJustified};
`;

export const AthleteRowAbsent = styled(AthleteRow)`
  background-color: ${colors.attendanceAbsent};
`;

export const AthleteRowNotSet = styled(AthleteRow)`
  background-color: ${colors.attendanceNotSet};
`;

export const CounterItemPresent = styled(CounterItem)`
  background-color: ${colors.attendancePresent};
`;

export const CounterItemJustified = styled(CounterItem)`
  background-color: ${colors.attendanceJustified};
`;

export const CounterItemAbsent = styled(CounterItem)`
  background-color: ${colors.attendanceAbsent};
`;

export const CounterItemNotSet = styled(CounterItem)`
  background-color: ${colors.attendanceNotSet};
`;

export const ErrorContainer = styled(Container)`
  justify-content: center;
  align-items: center;
`;

export const ErrorText = styled.Text`
  color: ${colors.danger};
  font-size: 16px;
  text-align: center;
  padding: 20px;
`;

export const AttendancePortrait = styled.Image`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  margin-right: 15px;
  background-color: ${colors.lightGray};
`;

export const BottomButtonsContainer = styled(Row)`
  justify-content: space-around;
  padding: 15px;
  background-color: ${colors.white};
  border-radius: 8px;
  margin-top: 10px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 3;
`;

export const ButtonTextWithMargin = styled(ButtonText)`
  margin-left: 8px;
`;

export const HeaderSpacing = styled(SpaceBetween)`
  margin-bottom: 10px;
`;

export const SessionInfo = styled(Heading)`
  font-size: 18px;
  color: ${colors.textPrimary};
`;

// Athletes Screen Components
export const DropdownRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: ${spacing.md}px;
`;

export const DropdownContainer = styled.View`
  flex: 1;
  margin-horizontal: 4px;
`;

export const AthleteDetailsRow = styled.View`
  justify-content: space-between;
`;

export const NoSelectionText = styled.Text`
  font-size: 16px;
  color: ${colors.textSecondary};
  text-align: center;
  margin-top: ${spacing.lg}px;
  font-style: italic;
`;

export const PickerContainer = styled.View`
  width: 65%;
  border-width: 1px;
  border-color: ${colors.border};
  border-radius: ${borderRadius.sm}px;
  background-color: ${colors.white};
`;

export const PickerHalf = styled.View`
  height: 40px;
`;

export const Checkmark = styled.Text`
  color: ${colors.white};
  font-weight: bold;
  font-size: 14px;
`;
