const sources = [
  { name: 'Alpine Valley', url: 'https://www.alpine-valley.com/hacker-houses', cadence: 'Tuesday · 10:00', state: 'Automatic' },
  { name: 'StartupQuestion', url: 'https://www.startupquestion.com/vc-directory', cadence: 'Thursday · 10:00', state: 'Automatic' },
  { name: 'HackerMap', url: 'https://hackermap.org/', cadence: 'On demand', state: 'Manual' },
  { name: 'Nowwhere', url: 'https://nowwhere.city/', cadence: 'On demand', state: 'Manual' },
  { name: 'AcceleratorHub', url: 'https://www.runfutureproof.com/acceleratorhub/programs', cadence: 'Outside our current focus', state: 'Paused' },
]

export default function ProgramSources() {
  return <section aria-labelledby="program-sources-heading" className="mb-8 rounded-xl border border-gray-200 bg-white p-5">
    <h2 id="program-sources-heading" className="text-lg font-semibold text-gray-900">Connected directories</h2>
    <p className="mt-1 text-sm text-gray-600">Configured collection schedule. Times are Europe/Berlin.</p>
    <ul className="mt-4 divide-y divide-gray-200">
      {sources.map(source => <li key={source.name} className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div><a href={source.url} target="_blank" rel="noopener noreferrer" className="font-medium text-gray-900 underline">{source.name}</a><p className="text-sm text-gray-600">{source.cadence}</p></div>
        <div className="text-right text-sm"><span className={source.state === 'Automatic' ? 'font-medium text-blue-800' : 'font-medium text-gray-600'}>{source.state}</span><p className="text-xs text-gray-500">Last run: not tracked yet</p></div>
      </li>)}
    </ul>
    <p className="mt-3 text-xs text-gray-500">This lists configured sources, not live service health. Candidate counts appear under queue statistics.</p>
  </section>
}
