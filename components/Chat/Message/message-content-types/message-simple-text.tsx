import {
  BubbleContainer,
  BubbleContentContainer,
} from "@/components/Chat/Message/components/message-bubble";
import { MessageLayout } from "@/components/Chat/Message/components/message-layout";
import { MessageText } from "@/components/Chat/Message/components/message-text";
import { useMessageContextStoreContext } from "@/components/Chat/Message/stores/message-store";
import { useSelect } from "@/data/store/storeHelpers";
import { DecodedMessage, TextCodec } from "@xmtp/react-native-sdk";
import { memo } from "react";

export const MessageSimpleText = memo(function MessageSimpleText(props: {
  message: DecodedMessage<[TextCodec]>;
}) {
  const { message } = props;

  const textContent = message.content();

  const { hasNextMessageInSeries, fromMe } = useMessageContextStoreContext(
    useSelect(["hasNextMessageInSeries", "fromMe"])
  );

  return (
    <MessageLayout>
      <BubbleContainer fromMe={fromMe}>
        <BubbleContentContainer
          fromMe={fromMe}
          hasNextMessageInSeries={hasNextMessageInSeries}
        >
          <MessageText inverted={fromMe}>{textContent}</MessageText>
        </BubbleContentContainer>
      </BubbleContainer>
    </MessageLayout>
  );
});

/**
 * Tried different approaches to implement native context menu, but it's not
 * working as expected. Still missing some pieces from libraries to achieve what we want
 */

// import { MessageContextMenu } from "@/components/Chat/Message/MessageContextMenu";
// import ContextMenu from "react-native-context-menu-view";
// import * as ContextMenu from "zeego/context-menu";

{
  /* <ContextMenuView
          onMenuWillShow={() => {
            console.log("onMenuWillShow");
          }}
          menuConfig={{
            menuTitle: "Message Options",
            menuItems: [
              {
                actionKey: "copy",
                actionTitle: "Copy",
                icon: {
                  type: "IMAGE_SYSTEM",
                  imageValue: {
                    systemName: "doc.on.doc",
                  },
                },
              },
              {
                actionKey: "delete",
                actionTitle: "Delete",
                menuAttributes: ["destructive"],
                icon: {
                  type: "IMAGE_SYSTEM",
                  imageValue: {
                    systemName: "trash",
                  },
                },
              },
            ],
          }}
          auxiliaryPreviewConfig={{
            transitionEntranceDelay: "RECOMMENDED",
            anchorPosition: "top",
            // alignmentHorizontal: "previewTrailing",
            verticalAnchorPosition: "top",
            // height: 600,
            // preferredHeight: {
            //   mode: "percentRelativeToWindow",
            //   percent: 50,
            // },
          }}
          previewConfig={{ previewType: "CUSTOM" }}
          // renderPreview={() => (
          //   <BubbleContentContainer
          //     fromMe={fromMe}
          //     hasNextMessageInSeries={hasNextMessageInSeries}
          //   >
          //     <MessageText inverted={fromMe}>{textContent}</MessageText>
          //   </BubbleContentContainer>
          // )}
          isAuxiliaryPreviewEnabled={true}
          renderPreview={() => (
            // <VStack
            //   style={{
            //     ...debugBorder(),
            //     position: "absolute",
            //     top: 0,
            //     left: 0,
            //     width: 40,
            //     height: 40,
            //   }}
            // ></VStack>
            <BubbleContentContainer
              fromMe={fromMe}
              hasNextMessageInSeries={hasNextMessageInSeries}
            >
              <MessageText inverted={fromMe}>{textContent}</MessageText>
            </BubbleContentContainer>
          )}
          renderAuxiliaryPreview={() => (
            <HStack
              style={{
                ...debugBorder(),
                columnGap: 10,
                padding: 10,
                paddingHorizontal: 20,
                backgroundColor: "white",
                borderRadius: 10,
              }}
            >
              <Text>😅</Text>
              <Text>🤣</Text>
              <Text>😂</Text>
              <Text>🤩</Text>
              <Text>🤗</Text>
              <Text>🤔</Text>
            </HStack>
          )}
        ></ContextMenuView> */
}
