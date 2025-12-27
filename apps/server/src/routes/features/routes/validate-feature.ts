/**
 * Validate feature route - Uses AI agent to check if a feature is already implemented
 */

import type { Request, Response } from 'express';
import { FeatureLoader } from '../../../services/feature-loader.js';
import { AgentService } from '../../../services/agent-service.js';
import { getErrorMessage, logError } from '../common.js';
import type { Feature } from '@automaker/types';

export function createValidateFeatureHandler(
  featureLoader: FeatureLoader,
  agentService: AgentService
) {
  return async (req: any, res: any) => {
    try {
      const { projectPath, featureId }: ValidateFeatureRequest = req.body;

      // Load the feature
      const feature = await featureLoader.get(projectPath, featureId);
      if (!feature) {
        return res.status(404).json({
          success: false,
          error: 'Feature not found',
        });
      }

      // Create a validation prompt
      const validationPrompt = `Your task is to review this feature and the existing codebase and determine whether or not it has been fully/partially/not implemented.

Feature Details:
- Title: ${feature.title}
- Category: ${feature.category}
- Description: ${feature.description}

Please analyze the codebase and provide your assessment in the following format (plain text, no markdown):

ASSESSMENT: [FULLY_IMPLEMENTED|PARTIALLY_IMPLEMENTED|NOT_IMPLEMENTED]
REASONING: [Brief explanation of your decision]
EVIDENCE: [Specific code/files that support your assessment]

Be thorough in your analysis. Check for:
- Related components, functions, or classes
- Test files
- Configuration changes
- Documentation updates
- Any other relevant implementation details

If the feature is FULLY_IMPLEMENTED, it should be complete and ready for approval.
If PARTIALLY_IMPLEMENTED, explain what's missing.
If NOT_IMPLEMENTED, explain why you believe this feature hasn't been addressed.`;

      // Create a temporary session for validation
      let session;
      try {
        // First create the session metadata
        session = await agentService.createSession(
          `Feature Validation: ${feature.title}`,
          projectPath,
          projectPath
        );

        // Then initialize the conversation session in memory
        await agentService.startConversation({
          sessionId: session.id,
          workingDirectory: projectPath,
        });
      } catch (sessionError) {
        console.error('[ValidateFeature] Failed to create session:', sessionError);
        return res.status(500).json({
          success: false,
          error: 'Failed to create agent session',
        });
      }

      // Send the validation prompt to the agent
      let result;
      try {
        result = await agentService.sendMessage({
          sessionId: session.id,
          message: validationPrompt,
          workingDirectory: projectPath,
        });
      } catch (messageError) {
        console.error('[ValidateFeature] Failed to send message:', messageError);

        // Clean up the session if it exists
        try {
          await agentService.deleteSession(session.id);
        } catch (cleanupError) {
          console.error('[ValidateFeature] Failed to cleanup session:', cleanupError);
        }

        return res.status(500).json({
          success: false,
          error: 'Failed to send message to agent',
        });
      }

      if (!result.success) {
        // Clean up the session
        try {
          await agentService.deleteSession(session.id);
        } catch (cleanupError) {
          console.error('[ValidateFeature] Failed to cleanup session:', cleanupError);
        }

        return res.status(500).json({
          success: false,
          error: 'Failed to validate feature',
        });
      }

      // Parse the agent response
      const response = result.message?.content || '';
      console.log('[ValidateFeature] Raw AI Response:', response);

      const assessmentMatch = response.match(
        /ASSESSMENT:\s*\*{0,2}(FULLY_IMPLEMENTED|PARTIALLY_IMPLEMENTED|NOT_IMPLEMENTED)\*{0,2}/
      );
      const reasoningMatch = response.match(/REASONING:\s*\*{0,2}([^\n*]+)\*{0,2}/);
      const evidenceMatch = response.match(/EVIDENCE:\s*\*{0,2}([\s\S]*?)\*{0,2}(?=\n\n|$)/);

      console.log('[ValidateFeature] Regex matches:');
      console.log('  - Assessment match:', assessmentMatch);
      console.log('  - Reasoning match:', reasoningMatch);
      console.log('  - Evidence match:', evidenceMatch);

      const assessment = assessmentMatch?.[1] || 'NOT_IMPLEMENTED';
      const reasoning = reasoningMatch?.[1] || 'Unable to determine reasoning';
      const evidence = evidenceMatch?.[1] || 'No specific evidence provided';

      console.log('[ValidateFeature] Extracted values:');
      console.log('  - Assessment:', assessment);
      console.log('  - Reasoning:', reasoning);
      console.log('  - Evidence:', evidence?.substring(0, 200) + '...');

      // Clean up the session
      await agentService.deleteSession(session.id);

      return res.json({
        success: true,
        validation: {
          assessment,
          reasoning,
          evidence,
          fullResponse: response,
        },
      });
    } catch (error) {
      console.error('[ValidateFeature] Error:', error);
      return res.status(500).json({
        success: false,
        error: (error as Error).message,
      });
    }
  };
}
