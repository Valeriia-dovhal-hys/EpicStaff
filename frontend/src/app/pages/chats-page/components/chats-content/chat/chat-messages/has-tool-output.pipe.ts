import { Pipe, PipeTransform } from '@angular/core';
import { GroupedMessage } from './chat-messages.component';

// Pipe to check if a tool has output
@Pipe({
  name: 'hasToolOutput',
  standalone: true,
})
export class HasToolOutputPipe implements PipeTransform {
  transform(groups: GroupedMessage[], toolCallId: string): boolean {
    // First get the call_id from the tool call
    let callId: string | undefined;

    // Find the tool call item to get its call_id
    for (const group of groups) {
      for (const item of group.items) {
        if (item.id === toolCallId && (item as any).call_id) {
          callId = (item as any).call_id;
          break;
        }
      }
      if (callId) break;
    }

    if (!callId) return false;

    // Now look for an output with matching call_id
    for (const group of groups) {
      for (const item of group.items) {
        if (
          item.type === 'function_call_output' &&
          (item as any).call_id === callId
        ) {
          return true;
        }
      }
    }

    return false;
  }
}
