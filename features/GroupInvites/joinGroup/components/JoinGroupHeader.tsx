// import { Avatar } from "@/components/avatar";
// import React from "react";
// import { StyleSheet, Text, View } from "react-native";

// /**
//  * Renders the header for joining a group.
//  *
//  * This component displays the group's name, avatar (if available),
//  * and description (if available).
//  *
//  * @param {Object} props - The component props
//  * @param {string} props.name - The name of the group
//  * @param {string} props.imageUrl - The URL of the group's avatar
//  * @param {string} [props.description] - The group's description
//  *
//  * @example
//  * // Input:
//  * <JoinGroupHeader
//  *   groupName="Awesome Group"
//  *   imageUrl="https://example.com/avatar.jpg"
//  *   description="A group for awesome people"
//  * />
//  * // Output: Renders header with group info
//  *
//  * @example
//  * // Input:
//  * <JoinGroupHeader
//  *   groupName="Another Group"
//  * />
//  * // Output: Renders header with group name only
//  *
//  * @example
//  * // Input:
//  * <JoinGroupHeader
//  *   groupName="Another Group"
//  *   imageUrl="https://example.com/another-avatar.jpg"
//  * />
//  * // Output: Renders header without description
//  */
// export const JoinGroupHeader: React.FC<{
//   groupName: string;
//   imageUrl?: string;
//   description?: string;
// }> = ({ groupName, imageUrl, description }) => {
//   const styles = useStyles();

//   return (
//     <View style={styles.groupInfo}>
//       {imageUrl && (
//         <Avatar
//           // size={AvatarSizes.default}
//           uri={imageUrl}
//           name={groupName}
//           style={styles.avatar}
//         />
//       )}
//       <Text>{groupName}</Text>
//       {description && <Text>{description}</Text>}
//     </View>
//   );
// };

// const useStyles = () => {
//   return StyleSheet.create({
//     groupInfo: {
//       flex: 1,
//     },
//     avatar: {
//       alignSelf: "center",
//       marginTop: 11,
//     },
//   });
// };
