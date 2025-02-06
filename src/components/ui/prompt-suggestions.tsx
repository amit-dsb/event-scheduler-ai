interface PromptSuggestionsProps {
  label: string
  append: (message: { role: "user"; content: string }) => void
  suggestions: string[]
}

export function PromptSuggestions({
  append,
  suggestions,
}: PromptSuggestionsProps) {
  return (
    <div className="space-y-6">
      {/* <h2 className="text-center text-2xl font-bold">{label}</h2> */}
      <div className="flex sm:gap-4 gap-2 items-center justify-center text-sm sm:flex-row flex-col pt-5 pb-4 sm:px-20 lg:px-40 px-5">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => append({ role: "user", content: suggestion })}
            className="h-max w-full flex rounded-xl border bg-background sm:p-4 p-1 hover:bg-muted"
          >
            <p className="w-full sm:text-sm text-xs">{suggestion}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
