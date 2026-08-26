'use client'

/**
 * Prompt Composer - Research-backed modular prompt construction tool
 * See PROMPT-COMPOSER-README.md for full documentation and research references
 */

import React, { useState, useMemo } from 'react'
import { useTheme } from 'next-themes'
import { Copy, Check, RotateCcw, Circle, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  promptComposerStyles,
  tw,
  COMPONENT_ARRAY,
  categoryLabels,
  categoryIcons,
} from './constants'
import {
  getCurrentCategoryColor,
  getCategoryBorderColor,
  countWords,
} from './utils/helpers'
import { PromptComposerProps } from './types'

const PromptComposer: React.FC<PromptComposerProps> = ({ className }) => {
  const { theme } = useTheme()
  const isLightMode = theme === 'light'
  // State to manage copy and clear feedback
  const [copied, setCopied] = useState(false)
  const [cleared, setCleared] = useState(false)

  const [selectedComponents, setSelectedComponents] = useState<Set<string>>(
    new Set()
  )
  const [audienceToggle, setAudienceToggle] = useState<'technical' | 'general'>(
    'general'
  )
  const [editedPrompt, setEditedPrompt] = useState('')

  const toggleComponent = (
    id: string,
    inputType: string,
    radioGroup?: string
  ) => {
    const newSelected = new Set(selectedComponents)

    if (inputType === 'radio' && radioGroup) {
      // Clear other radio buttons in the same group
      COMPONENT_ARRAY.forEach((comp) => {
        if (comp.radioGroup === radioGroup && comp.id !== id) {
          newSelected.delete(comp.id)
        }
      })
      // Add current selection
      newSelected.add(id)
    } else if (inputType === 'checkbox') {
      // Toggle checkbox
      if (newSelected.has(id)) {
        newSelected.delete(id)
      } else {
        newSelected.add(id)
      }
    }

    setSelectedComponents(newSelected)
  }

  // Handle audience toggle separately
  const handleAudienceToggle = (checked: boolean) => {
    setAudienceToggle(checked ? 'technical' : 'general')
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(editedPrompt)
      setCopied(true)
      // Revert icon/text after a short delay
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const clearAll = () => {
    // Reset all state to initial values
    setSelectedComponents(new Set())
    setAudienceToggle('general')
    setEditedPrompt('')
    setCleared(true)
    // Revert icon/text after a short delay
    setTimeout(() => setCleared(false), 1500)
  }

  // Prompt compilation with research-backed ordering
  const compiledPrompt = useMemo(() => {
    const sections: { [key: string]: string[] } = {
      role: [],
      audience: [],
      context: [],
      reasoning: [],
      output: [],
      constraints: [],
      meta: [],
    }

    // Add audience toggle if set to technical
    if (audienceToggle === 'technical') {
      sections.audience.push(
        'Assume your audience has strong technical background and can handle detailed, specialized explanations.'
      )
    } else {
      sections.audience.push(
        'Explain concepts in accessible language suitable for a general audience without extensive technical background.'
      )
    }

    // Process selected components
    COMPONENT_ARRAY.forEach((component) => {
      if (selectedComponents.has(component.id)) {
        sections[component.category].push(component.template)
      }
    })

    // Compile in research-optimal order
    const orderedSections = [
      'role',
      'audience',
      'context',
      'reasoning',
      'output',
      'constraints',
      'meta',
    ]
    const parts: string[] = []

    orderedSections.forEach((category) => {
      if (sections[category].length > 0) {
        parts.push(sections[category].join(' '))
      }
    })

    return parts.join('\n\n')
  }, [selectedComponents, audienceToggle])

  // The textarea is user-editable, so `compiledPrompt` cannot simply be
  // rendered directly — but re-syncing in an effect meant every component
  // toggle painted the stale prompt first. Adjusting during render instead
  // keeps the edit buffer while making the update single-pass.
  const [lastCompiled, setLastCompiled] = useState(compiledPrompt)
  if (lastCompiled !== compiledPrompt) {
    setLastCompiled(compiledPrompt)
    setEditedPrompt(compiledPrompt)
  }

  const groupedComponents = COMPONENT_ARRAY.reduce(
    (acc, component) => {
      if (!acc[component.category]) {
        acc[component.category] = []
      }
      acc[component.category].push(component)
      return acc
    },
    {} as { [key: string]: typeof COMPONENT_ARRAY }
  )

  // Helper function to get the selection indicator for each category
  const getCategoryIndicator = (category: string) => {
    // Special handling for audience category (uses Switch)
    if (category === 'audience') {
      return (
        <CheckCircle2 className="h-4 w-4 text-gray-900 dark:text-gray-100" />
      )
    }

    const categoryComponents = groupedComponents[category] || []

    if (categoryComponents.length === 0) return null

    // Check if this category uses radio buttons
    const hasRadioButtons = categoryComponents.some(
      (comp) => comp.inputType === 'radio'
    )

    if (hasRadioButtons) {
      // For radio buttons: show filled check if any selected, empty circle if none
      const hasSelection = categoryComponents.some((comp) =>
        selectedComponents.has(comp.id)
      )
      return hasSelection ? (
        <CheckCircle2 className="h-4 w-4 text-gray-900 dark:text-gray-100" />
      ) : (
        <Circle className="h-4 w-4 text-gray-900 dark:text-gray-100 opacity-40" />
      )
    }

    // For checkboxes: show fraction
    const totalCheckboxes = categoryComponents.filter(
      (comp) => comp.inputType === 'checkbox'
    ).length
    const selectedCheckboxes = categoryComponents.filter(
      (comp) => comp.inputType === 'checkbox' && selectedComponents.has(comp.id)
    ).length

    return (
      <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 min-w-[2rem] text-right">
        {selectedCheckboxes}/{totalCheckboxes}
      </span>
    )
  }

  const statistics = {
    components: selectedComponents.size + 1,
    wordCount: countWords(editedPrompt),
    categories: Object.keys(categoryLabels).filter(
      (cat) =>
        groupedComponents[cat]?.some((comp) =>
          selectedComponents.has(comp.id)
        ) ||
        (cat === 'audience' && audienceToggle)
    ).length,
  }

  return (
    <div className={`${promptComposerStyles.container} ${className || ''}`}>
      {/* Header */}
      <div className="text-center">
        <h1 className={promptComposerStyles.title} style={{ color: 'inherit' }}>
          🧩 Prompt Composer
        </h1>
        <p className={promptComposerStyles.subtitle}>
          Research-backed modular construction for optimized prompts.
        </p>
      </div>

      {/* Main Layout */}
      <div className={promptComposerStyles.mainLayout}>
        {/* Component Selector Panel */}
        <Card
          className={`${promptComposerStyles.componentGroup} w-full lg:w-1/2`}
        >
          <CardHeader className={promptComposerStyles.cardHeader}>
            <CardTitle>
              <h3 className="text-lg font-bold">Component Selector</h3>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {Object.entries(categoryLabels).map(([category, label]) => (
                <AccordionItem
                  value={category}
                  key={category}
                  className="mb-2 rounded-lg"
                >
                  <AccordionTrigger
                    className={`${promptComposerStyles.categoryButton} bg-[var(--bg)] border-[var(--bc)]`}
                    style={
                      {
                        '--bg': getCurrentCategoryColor(category, isLightMode),
                        '--bc': getCategoryBorderColor(category),
                        width: '100%',
                        padding: '10px 5px',
                        display: 'flex',
                      } as React.CSSProperties
                    }
                  >
                    <div className="flex items-center justify-between w-full pr-2">
                      <div className="flex items-center">
                        <span className={promptComposerStyles.categoryIcon}>
                          {
                            categoryIcons[
                              category as keyof typeof categoryIcons
                            ]
                          }
                        </span>
                        <span
                          className={promptComposerStyles.categoryLabel}
                          style={{ fontSize: '1rem', fontWeight: 'bold' }}
                        >
                          {label}
                        </span>
                      </div>
                      <div className="flex items-center">
                        {getCategoryIndicator(category)}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className={promptComposerStyles.expandedContainer}>
                      <div
                        className={promptComposerStyles.componentContainer}
                        style={{
                          borderColor: getCategoryBorderColor(category),
                          backgroundColor:
                            getCategoryBorderColor(category) + '40',
                        }}
                      >
                        <div className={promptComposerStyles.componentsWrapper}>
                          {/* Handle audience toggle separately */}
                          {category === 'audience' && (
                            <div
                              className={promptComposerStyles.componentWrapper}
                            >
                              <div className={tw.audienceToggle}>
                                <Label
                                  htmlFor="audience-switch"
                                  className={
                                    audienceToggle === 'general'
                                      ? tw.audienceLabelActive
                                      : tw.audienceLabelInactive
                                  }
                                >
                                  General
                                </Label>
                                <Switch
                                  id="audience-switch"
                                  checked={audienceToggle === 'technical'}
                                  onCheckedChange={handleAudienceToggle}
                                  className="data-[state=unchecked]:bg-gray-300 data-[state=checked]:bg-gray-900 [&_[data-slot=switch-thumb]]:bg-white"
                                />
                                <Label
                                  htmlFor="audience-switch"
                                  className={
                                    audienceToggle === 'technical'
                                      ? tw.audienceLabelActive
                                      : tw.audienceLabelInactive
                                  }
                                >
                                  Technical
                                </Label>
                              </div>
                            </div>
                          )}

                          {/* Regular components */}
                          {(() => {
                            const categoryComponents =
                              groupedComponents[category] || []
                            const radioGroups: {
                              [key: string]: typeof categoryComponents
                            } = {}
                            const checkboxComponents: typeof categoryComponents =
                              []

                            // Separate radio and checkbox components
                            categoryComponents.forEach((component) => {
                              if (
                                component.inputType === 'radio' &&
                                component.radioGroup
                              ) {
                                if (!radioGroups[component.radioGroup]) {
                                  radioGroups[component.radioGroup] = []
                                }
                                radioGroups[component.radioGroup].push(
                                  component
                                )
                              } else if (component.inputType === 'checkbox') {
                                checkboxComponents.push(component)
                              }
                            })

                            return (
                              <>
                                {/* Render RadioGroups */}
                                {Object.entries(radioGroups).map(
                                  ([groupName, groupComponents]) => (
                                    <div
                                      key={groupName}
                                      className={
                                        promptComposerStyles.componentWrapper
                                      }
                                    >
                                      <div
                                        className={tw.radioCheckboxContainer}
                                      >
                                        <RadioGroup
                                          value={
                                            groupComponents.find((comp) =>
                                              selectedComponents.has(comp.id)
                                            )?.id || ''
                                          }
                                          onValueChange={(value) => {
                                            const component =
                                              groupComponents.find(
                                                (comp) => comp.id === value
                                              )
                                            if (component) {
                                              toggleComponent(
                                                component.id,
                                                component.inputType,
                                                component.radioGroup
                                              )
                                            }
                                          }}
                                        >
                                          {groupComponents.map((component) => (
                                            <div
                                              key={component.id}
                                              className={tw.radioCheckboxItem}
                                            >
                                              <RadioGroupItem
                                                value={component.id}
                                                id={component.id}
                                              />
                                              <Label
                                                htmlFor={component.id}
                                                className={tw.componentLabel}
                                              >
                                                <span
                                                  className={
                                                    tw.componentLabelTitle
                                                  }
                                                >
                                                  {component.label}:&nbsp;
                                                </span>
                                                <span
                                                  className={
                                                    tw.componentLabelDescription
                                                  }
                                                >
                                                  {component.description}
                                                </span>
                                              </Label>
                                            </div>
                                          ))}
                                        </RadioGroup>
                                      </div>
                                    </div>
                                  )
                                )}

                                {/* Render Checkbox components */}
                                {checkboxComponents.map((component) => (
                                  <div
                                    key={component.id}
                                    className={
                                      promptComposerStyles.componentWrapper
                                    }
                                  >
                                    <div className={tw.radioCheckboxContainer}>
                                      <Checkbox
                                        id={component.id}
                                        checked={selectedComponents.has(
                                          component.id
                                        )}
                                        onCheckedChange={() =>
                                          toggleComponent(
                                            component.id,
                                            component.inputType
                                          )
                                        }
                                      />
                                      <Label
                                        htmlFor={component.id}
                                        className={tw.componentLabel}
                                      >
                                        <span
                                          className={tw.componentLabelTitle}
                                        >
                                          {component.label}:&nbsp;
                                        </span>
                                        <span
                                          className={
                                            tw.componentLabelDescription
                                          }
                                        >
                                          {component.description}
                                        </span>
                                      </Label>
                                    </div>
                                  </div>
                                ))}
                              </>
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Compiled Prompt Panel */}
        <Card
          className={`${promptComposerStyles.componentGroup} w-full lg:w-1/2`}
        >
          <CardHeader>
            <div className={promptComposerStyles.livePreviewHeader}>
              <CardTitle>Compiled Prompt</CardTitle>
            </div>
            <div className={promptComposerStyles.buttonContainer}>
              <Button
                onClick={clearAll}
                disabled={
                  selectedComponents.size === 0 && audienceToggle === 'general'
                }
                variant="outline"
              >
                {cleared ? (
                  <Check className="mr-2 h-4 w-4 text-green-600" />
                ) : (
                  <RotateCcw className="mr-2 h-4 w-4" />
                )}
                {cleared ? 'Cleared!' : 'Clear'}
              </Button>
              <Button
                onClick={copyToClipboard}
                disabled={!editedPrompt.trim()}
                variant="outline"
              >
                {copied ? (
                  <Check className="mr-2 h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className={promptComposerStyles.previewContainer}>
              {editedPrompt.trim() ? (
                <textarea
                  value={editedPrompt}
                  onChange={(e) => setEditedPrompt(e.target.value)}
                  className="w-full min-h-[400px] p-4 bg-transparent text-gray-200 border-none outline-none resize-none font-mono text-sm leading-relaxed"
                  placeholder="Your compiled prompt will appear here..."
                />
              ) : (
                <div className={promptComposerStyles.emptyState}>
                  <div className={promptComposerStyles.emptyStateTitle}>
                    No components selected
                  </div>
                  <div className={promptComposerStyles.emptyStateSubtitle}>
                    Choose components from the left panel to build your prompt
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Statistics & Analysis */}
            <div className="mt-6">
              {/* Statistics Card */}
              <Card className={promptComposerStyles.statsCard}>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center">
                    📊 Prompt Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={tw.statsGrid}>
                    <div>
                      <div className={tw.statsWord}>
                        Words: {statistics.wordCount}
                      </div>
                    </div>
                    <div>
                      <div className={tw.statsComponent}>
                        Components: {statistics.components}
                      </div>
                    </div>
                    <div>
                      <div className={tw.statsCategory}>
                        Categories: {statistics.categories}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
      <br />
      {/* Appendix */}
      <Card className={promptComposerStyles.componentGroup}>
        <CardContent>
          {/* Research-Based Design Documentation */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem
              value="research-documentation"
              className={promptComposerStyles.researchDocumentation}
            >
              <AccordionTrigger className={promptComposerStyles.categoryButton}>
                🔬 Research-Backed Design Documentation
              </AccordionTrigger>
              <AccordionContent>
                <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Design Philosophy & Research Foundation
                    </h4>
                    <p>
                      This Prompt Composer integrates research in LLM
                      effectiveness and UI/UX design.
                      <strong> Radio buttons</strong> are used for mutually
                      exclusive choices (role specification, reasoning strategy)
                      because research shows conflicting instructions can reduce
                      LLM performance.
                      <strong> Checkboxes</strong> enable beneficial component
                      combinations for context, output formatting, and
                      constraints. The <strong>binary toggle</strong> for
                      audience targeting follows established UX patterns and
                      reflects the fundamental technical/non-technical
                      communication divide. Component ordering follows task
                      decomposition research showing role → context → reasoning
                      → output → constraints as the optimal sequence for LLM
                      comprehension.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Evidence-Based Component Categories
                    </h4>
                    <p>
                      Each category represents a distinct cognitive function
                      based on prompt engineering research:
                      <strong>Role Specification</strong> establishes the AI
                      persona, <strong>Context Provision</strong> leverages
                      few-shot learning principles,{' '}
                      <strong>Reasoning Strategy</strong> applies
                      chain-of-thought research for complex tasks,{' '}
                      <strong>Output Instructions</strong> ensure structured
                      responses, <strong>Constraints</strong> maintain focus,
                      and <strong>Meta-Prompt Enhancements</strong> enable
                      self-improvement capabilities.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      UI/UX Component Selection Strategy
                    </h4>
                    <p>
                      The interface design follows established usability
                      principles: radio buttons for mutually exclusive cognitive
                      roles prevent conflicting instructions, toggle switches
                      for binary states provide immediate visual feedback, and
                      checkboxes for additive elements allow beneficial layering
                      of context and constraints. Visual hierarchy and color
                      coding reduce cognitive load while maintaining
                      accessibility standards.
                    </p>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      References
                    </h4>
                    <div className="text-xs space-y-2 text-gray-600 dark:text-gray-400">
                      <p>
                        Brown, T., Mann, B., Ryder, N., Subbiah, M., Kaplan, J.
                        D., Dhariwal, P., ... & Amodei, D. (2020). Language
                        models are few-shot learners.{' '}
                        <em>
                          Advances in Neural Information Processing Systems
                        </em>
                        , 33, 1877-1901. Available:{' '}
                        <a
                          href="https://arxiv.org/abs/2005.14165"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          https://arxiv.org/abs/2005.14165
                        </a>
                      </p>

                      <p>
                        Khot, T., Trivedi, H., Finlayson, M., Sabharwal, A., &
                        Clark, P. (2023). Decomposed prompting: A modular
                        approach for solving complex tasks.{' '}
                        <em>
                          Proceedings of the International Conference on
                          Learning Representations
                        </em>
                        . Available:{' '}
                        <a
                          href="https://arxiv.org/abs/2210.02406"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          https://arxiv.org/abs/2210.02406
                        </a>
                      </p>

                      <p>
                        Lu, Y., Bartolo, M., Moore, A., Riedel, S., & Stenetorp,
                        P. (2022). Fantastically ordered prompts and where to
                        find them: Overcoming few-shot prompt order sensitivity.{' '}
                        <em>
                          Proceedings of the 60th Annual Meeting of the
                          Association for Computational Linguistics
                        </em>
                        , 1, 8086-8098. Available:{' '}
                        <a
                          href="https://arxiv.org/abs/2104.08786"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          https://arxiv.org/abs/2104.08786
                        </a>
                      </p>

                      <p>
                        Min, S., Lyu, X., Holtzman, A., Artetxe, M., Lewis, M.,
                        Hajishirzi, H., & Zettlemoyer, L. (2022). Rethinking the
                        role of demonstrations: What makes in-context learning
                        work?{' '}
                        <em>
                          Proceedings of the 2022 Conference on Empirical
                          Methods in Natural Language Processing
                        </em>
                        , 11048-11064. Available:{' '}
                        <a
                          href="https://arxiv.org/abs/2202.12837"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          https://arxiv.org/abs/2202.12837
                        </a>
                      </p>

                      <p>
                        Nielsen, J., & Budiu, R. (2012).{' '}
                        <em>Mobile usability</em>. New Riders Publishing.
                        Available:{' '}
                        <a
                          href="https://www.nngroup.com/books/mobile-usability/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          https://www.nngroup.com/books/mobile-usability/
                        </a>
                      </p>

                      <p>
                        Tullis, T., & Albert, B. (2013).{' '}
                        <em>
                          Measuring the user experience: Collecting, analyzing,
                          and presenting usability metrics
                        </em>
                        . Morgan Kaufmann.
                      </p>

                      <p>
                        Wang, X., Wei, J., Schuurmans, D., Le, Q., Chi, E.,
                        Narang, S., ... & Zhou, D. (2023). Self-consistency
                        improves chain of thought reasoning in language models.{' '}
                        <em>
                          International Conference on Learning Representations
                        </em>
                        . Available:{' '}
                        <a
                          href="https://arxiv.org/abs/2203.11171"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          https://arxiv.org/abs/2203.11171
                        </a>
                      </p>

                      <p>
                        Wei, J., Wang, X., Schuurmans, D., Bosma, M., Chi, E.,
                        Le, Q. V., ... & Zhou, D. (2022). Chain-of-thought
                        prompting elicits reasoning in large language models.{' '}
                        <em>
                          Advances in Neural Information Processing Systems
                        </em>
                        , 35, 24824-24837. Available:{' '}
                        <a
                          href="https://arxiv.org/abs/2201.11903"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          https://arxiv.org/abs/2201.11903
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="app-guide"
              className={promptComposerStyles.researchDocumentation}
            >
              <AccordionTrigger className={promptComposerStyles.categoryButton}>
                🧩Want to use Prompt-Composer as an app?
              </AccordionTrigger>
              <AccordionContent>
                <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Now you can!
                    </h4>
                    <p>
                      On iOS: <br />
                      1. Open in Safari, <br />
                      2. Tap the share button and <br />
                      3. Select <b>Add to Home Screen</b>.
                      <br />I THINK android works but I need to do QA.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}

export default PromptComposer
