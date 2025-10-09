function Experience() {
  const companies = [
    { name: "Company 1", role: "Role", period: "2023 - Present" },
    { name: "Company 2", role: "Role", period: "2022 - 2023" },
    { name: "Company 3", role: "Role", period: "2021 - 2022" },
    { name: "Company 4", role: "Role", period: "2020 - 2021" },
    { name: "Company 5", role: "Role", period: "2019 - 2020" },
    { name: "Company 6", role: "Role", period: "2018 - 2019" },
  ]

  return (
    <section id="experience" className="min-h-screen bg-white py-20 px-6 lg:px-16 xl:px-24">
      <div className="w-full max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-16 text-center">
          Experience
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {companies.map((company, index) => (
            <div 
              key={index}
              className="border-l-4 border-blue-500 pl-8 py-6 hover:bg-gray-50 transition-all hover:shadow-lg hover:scale-105 duration-300 rounded-r-lg"
            >
              <h3 className="text-2xl lg:text-3xl font-semibold text-gray-900">{company.name}</h3>
              <p className="text-lg lg:text-xl text-gray-700 mt-2">{company.role}</p>
              <p className="text-sm lg:text-base text-gray-500 mt-3">{company.period}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Experience